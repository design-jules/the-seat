# The Seat — Full Project Documentation

**Live site:** theseatmethod.com
**GitHub:** github.com/design-jules/the-seat
**Owner:** Julie Kirkham (jules.kirkham@gmail.com)

---

## What It Is

The Seat is an L&D pressure-testing tool. Training designers (and the leaders who review their work) upload a training deck or paste content, then have live conversations with three AI-powered learner personas — each representing a different type of person who shows up in a training room. The personas read the actual content and respond authentically: asking questions, pushing back, getting distracted, or getting excited. The goal is to surface problems before a review meeting, not during one.

---

## The Three Personas

| Name | Type | Personality |
|------|------|-------------|
| **Dana** | The Skeptic | Experienced, dry, withholding. Won over by specificity and proof — not polish. Starts at a 5, not a 9. |
| **Marcus** | The Slammed | 14 Slack messages waiting, meeting in 20 minutes. Needs to know: what do I actually DO with this? |
| **Bex** | The Hype | Loves everything. Takes notes on everything. Does nothing with it. Not aware of this pattern. |

Each persona is powered by a system prompt in `/app/api/chat/route.ts` that instructs the AI to behave consistently with the character. They reference specific content from the uploaded training rather than speaking generically.

---

## Tech Stack

| Layer | Tool | Version |
|-------|------|---------|
| Framework | Next.js (App Router) | 14.2.35 |
| Language | TypeScript | 5.x |
| Styling | Custom CSS (globals.css) | — |
| Database + Auth | Supabase | @supabase/ssr 0.10.2 |
| AI / Chat | Anthropic Claude API | @anthropic-ai/sdk 0.90.0 |
| Payments | Stripe | 22.1.1 |
| PDF extraction | pdfjs-dist (client-side) | 5.7.284 |
| DOCX extraction | mammoth | 1.12.0 |
| Hosting | Vercel | — |

---

## External Services

### Supabase
- **Project URL:** `https://ljungjqovdqaztpukvvt.supabase.co`
- **Used for:** Database (sessions, punch list items, access codes, approved users, beta requests), and user authentication (email/password sign-up and login)
- **Anon key** lives in `NEXT_PUBLIC_SUPABASE_ANON_KEY` env var (safe to expose — RLS protects data)
- **Service role key** is NOT used in this codebase — all writes go through the anon key + user JWT + RLS policies
- **Auth method:** Supabase built-in email auth. Sessions managed via cookies using `@supabase/ssr`. Client-side Supabase lives in `/lib/supabase/client.ts`, server-side in `/lib/supabase/server.ts`.
- **Note:** There is currently no session refresh middleware. Auth tokens are passed explicitly in the `Authorization` header from client to API routes to compensate.

### Anthropic
- **Used for:** Powering the three personas in live chat (`/app/api/chat/route.ts`)
- **Model:** Claude (via `@anthropic-ai/sdk`) — streaming responses
- **Key lives in:** `ANTHROPIC_API_KEY` env var (Vercel + local `.env.local`)
- **Max duration:** 60 seconds per request (set at route level)
- **Other AI routes:** `/api/quick-scan` (fast read of training content), `/api/punch-list` (generates the actionable list at end of session)

### Stripe
- **Used for:** One-time payment for full access (pay-per-session or permanent — TBD on model)
- **Keys live in:** `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` env vars
- **Flow:** `/api/create-checkout` → Stripe hosted checkout → redirect to `/session?payment_success=true&session_id=...` → `/api/verify-payment` confirms and grants access
- **Status:** Wired up but access model not fully defined yet (beta is code-gated, not payment-gated for now)

### Vercel
- **Hosting:** Automatic deploys from `main` branch on GitHub
- **Important limits:** 
  - Serverless function body size limit: 4.5MB (this is why PDF extraction happens client-side, not server-side — large decks were crashing the upload route)
  - Max function duration: 60s (set explicitly on the chat route)

### FormSubmit
- **Used for:** Sending a notification email to `theseatmethod@gmail.com` when someone submits a beta code request
- **No account needed** — uses `https://formsubmit.co/ajax/theseatmethod@gmail.com`

---

## Database Schema

All tables live in the Supabase project. Row Level Security (RLS) is enabled on everything.

### `sessions`
Stores each tool session.
```
id             uuid (PK)
user_id        uuid → auth.users
persona        text  ('skeptic' | 'hype' | 'maybe')
training_topic text
confidence_before  int
confidence_after   int
created_at     timestamptz
```
Policy: users can only read/write their own rows.

### `punch_list_items`
Stores the action items generated at the end of a session.
```
id          uuid (PK)
session_id  uuid → sessions
item        text
order_index int
created_at  timestamptz
```
Policy: users can only access items belonging to their own sessions.

### `access_codes`
Stores beta access codes. This is the gating mechanism for the beta.
```
id          uuid (PK)
code        text (unique, uppercase)
email       text (null = unclaimed)
note        text (null = normal | 'generic' = reusable by anyone)
created_at  timestamptz
used_at     timestamptz
```
**How the code system works:**
- All codes are stored here, uppercase (e.g. `SEAT158`, `TAKEASEAT`)
- `note = 'generic'`: reusable by anyone, no account tying. Used for `TAKEASEAT` and as a workaround for troubleshooting.
- `note = null` (normal code): first logged-in user to enter it claims it permanently. Their email is written to the `email` field and `used_at` is stamped. After that, only that account can re-enter the code.
- If someone tries to use a claimed code from a different account, they get: *"This code has already been claimed by another account."*
- If someone enters a normal code while not logged in, they get: *"Sign in first — codes are tied to your account so only you can use it."*

**Validation route:** `POST /api/validate-code`
The client sends the code plus an `Authorization: Bearer <token>` header with the user's Supabase session token. This avoids relying on server-side cookie parsing (which was unreliable without session refresh middleware).

### `approved_users`
Permanent access list. Once a user successfully uses a code, they're written here. This means they don't need to re-enter a code on every visit — the app checks this table when they sign in.
```
user_id       uuid (PK) → auth.users
approved_via  text ('code' | 'paid')
approved_at   timestamptz
```
Policy: users can read their own row only.

### `beta_requests`
Email capture for people who don't have a code yet.
```
email       text
created_at  timestamptz
```

---

## Access Flow (How Someone Gets In)

```
Visit /session
    ↓
Are they in sessionStorage with 'the-seat-access'?  →  Yes → straight through
    ↓ No
Are they a logged-in approved_user?  →  Yes → straight through (+ write to sessionStorage)
    ↓ No
Show access gate:
    Option A: Enter a code  →  /api/validate-code  →  if valid, sessionStorage = 'code', proceed
    Option B: Pay via Stripe  →  /api/create-checkout  →  Stripe  →  /api/verify-payment  →  proceed
    Option C: Request a code via email (goes to beta_requests + pings theseatmethod@gmail.com)
```

---

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Homepage — hero, how it works, who it's for, contact |
| `/session` | The main tool — upload, chat with personas, get punch list |
| `/resources` | Free downloads — currently: Before You Take a Seat checklist |
| `/about` | About Julie |
| `/how-it-works` | Explainer page |
| `/access` | Access / sign-in page |
| `/auth` | Supabase auth callback handler |
| `/contact` | Contact form |
| `/terms` | Terms and Conditions |

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chat` | POST | Streams persona responses (Claude) |
| `/api/quick-scan` | POST | Fast summary of uploaded training content |
| `/api/punch-list` | POST | Generates the post-session action list |
| `/api/validate-code` | POST | Validates and claims access codes |
| `/api/create-checkout` | POST | Creates a Stripe checkout session |
| `/api/verify-payment` | POST | Confirms Stripe payment and grants access |
| `/api/extract-text` | POST | Legacy route — superseded by client-side extraction |

---

## Key Components

| File | What it does |
|------|-------------|
| `components/Nav.tsx` | Top navigation. Includes hamburger menu for mobile (shows below 900px). Auth-aware: shows Sign In or Sign Out. |
| `components/Footer.tsx` | Simple footer with © and Terms link. Uses `<div>` not `<nav>` to avoid inheriting nav styles. |
| `components/NavWrapper.tsx` | Wraps Nav for server/client boundary |
| `components/PersonaCycler.tsx` | Animated persona cycling on homepage |
| `components/Reveal.tsx` | Scroll-triggered reveal animation |
| `components/Ticker.tsx` | Scrolling ticker component |

---

## PDF / File Handling

Large training decks were crashing the upload flow due to Vercel's 4.5MB serverless body size limit. The fix: **all file extraction happens in the browser**, not on the server.

- **PDFs:** Extracted client-side using `pdfjs-dist`. The worker file lives at `/public/pdf.worker.min.mjs` (copied from `node_modules/pdfjs-dist/build/`). Only the extracted text is sent to the API.
- **DOCX:** Extracted client-side using `mammoth` (dynamic import). Same approach — text only hits the API.
- **Supported file types:** PDF, DOCX
- **There is no file size limit** in practice (extraction happens locally). The theoretical limit is just browser memory.

---

## Resources / Free Downloads

Located at `/resources`. Files served from `/public/resources/`.

| Resource | File | Status |
|----------|------|--------|
| Before You Take a Seat | `/public/resources/before-you-take-a-seat.pdf` | Live |
| Sparkle Dust Starter Kit | — | Coming soon |

The resource card cover shows a cropped thumbnail of the PDF first page (`before-you-take-a-seat-preview.png`), generated via macOS Quick Look and committed to the repo.

---

## Current Beta Codes

Codes are managed directly in Supabase (`access_codes` table). To create new ones, insert rows with a unique `code` value (uppercase).

| Code | Type | Notes |
|------|------|-------|
| `TAKEASEAT` | generic | Permanently reusable. Works without an account. Share freely — revoke by deleting or changing `note`. |
| `SEAT158` | generic | Temporarily set to generic after a troubleshooting issue. Can be returned to normal by setting `note = null`. |
| Others (SEAT### format) | normal | Account-tied. First person to enter claims it permanently. |

To generate new codes: insert rows into `access_codes` directly via Supabase dashboard or SQL:
```sql
insert into access_codes (code) values ('SEAT159'), ('SEAT160'), ('SEAT161');
```

To make a code generic (reusable/unlinked):
```sql
update access_codes set note = 'generic' where code = 'SEAT159';
```

To revoke a code:
```sql
delete from access_codes where code = 'SEAT159';
```

---

## Known Quirks + Things to Watch

- **No session refresh middleware:** Supabase recommends a middleware file to auto-refresh auth tokens. We don't have one. The workaround is passing the token explicitly in the `Authorization` header on API calls. This works but should be properly addressed eventually.
- **`persona` column still uses old name:** The DB schema uses `'maybe'` for what is now called "The Slammed" (Marcus). There's a migration (003) that was meant to rename it but the column check constraint may still reference `'maybe'`. Low priority since it's working.
- **Stripe is wired but not the primary gate:** During beta, access is code-gated. Stripe is live and functional but nobody is being directed to pay yet.
- **No email on sign-up:** There's no onboarding email after account creation. Users just get a Supabase magic link or confirmation — nothing branded.

---

## Product Roadmap

### Now (fixes + polish)
- [ ] Add Supabase session refresh middleware so auth is bulletproof without the header workaround
- [ ] Return SEAT158 to account-tied (set `note = null`) once we're confident the auth fix is solid
- [ ] Mobile: verify persona triptych stacking fix is live and working
- [ ] Accessibility pass on the slider inputs and chat interface
- [ ] Swap placeholder testimonial quotes for real ones as they come in

### Soon (features ready to build)
- [x] **Combined PDF export** — ✅ Built. After any persona session, a "Download PDF" panel appears with all completed punch lists. Accumulates as the user goes through all three personas. Generates a print-ready page with priorities, titles, and detail for each item.
- [ ] **Video explainer on Resources page** — Julie records a "how to get the most out of this" video. Embed on `/resources`. Future: gate premium video content behind login/paid access.
- [ ] **Tiered resources** — Some resources visible to all, others only for logged-in or paid users. Requires an access check on the resources page similar to the session gate.
- [ ] **Email onboarding** — when someone creates an account, send a welcome email with their access confirmed, what to expect, and a link back to the tool
- [ ] **Session history** — users can see past sessions and re-read punch lists from `/my-sessions` or similar. Data already exists in Supabase (`sessions` + `punch_list_items`).
- [ ] **Sparkle Dust Starter Kit** — the second free resource. Ice breakers, analogies, engagement games. Copy drafted, just needs the actual PDF.
- [ ] **Confidence tracking over time** — before/after confidence scores are already stored. Build a simple chart or summary showing trends across sessions.

### Medium term (bigger swings)
- [ ] **Leader view** — a separate mode or dashboard for L&D leaders to send training to The Seat on behalf of their team, review results, and track patterns across designers
- [ ] **Cohort / team access** — bulk code generation, team seats, org-level billing instead of per-user
- [ ] **Persona customization** — let users describe their specific audience (e.g. "technical compliance team in financial services") and have the personas adapt their lens
- [ ] **Multi-round sessions** — iterate on the training in-tool. Upload v1, get feedback, revise, re-run with the same personas and see what changed
- [ ] **Integration with common authoring tools** — Articulate, Rise, Google Slides import. Right now it's PDF/DOCX only.
- [ ] **Stripe fully activated** — define the pricing model (per session? annual seat? team tier?) and start directing non-beta users to pay

### Longer horizon (vision stuff)
- [ ] **Benchmark database** — anonymized aggregate data across sessions to show "training in this topic area typically scores X with The Skeptic" — so designers can calibrate
- [ ] **Pre-flight mode** — a lighter, faster version of the tool that takes a draft outline (not a full deck) and gives a quick read before a full build
- [ ] **Certification / badge** — "This training passed The Seat" as something designers can attach to their work when sharing with stakeholders
- [ ] **API / white-label** — offer The Seat as an embeddable tool for LMS platforms, consultancies, or L&D team toolkits

---

## Environment Variables

All of these need to be set in Vercel (production) and `.env.local` (local dev):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
STRIPE_PRICE_ID
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

---

## Deployment

- **Repo:** github.com/design-jules/the-seat
- **Branch:** `main` — every push to main auto-deploys via Vercel
- **No staging environment** currently — changes go straight to production
- **Build command:** `next build` (standard)
- **To roll back:** revert the commit and push, or use Vercel dashboard to redeploy a previous build

---

*Last updated: June 2026*
