# Technical Reference — The Seat

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14, App Router | No Pages router |
| Language | TypeScript | Strict mode |
| Styling | Tailwind + inline styles | Globals in `app/globals.css`. Most component styles are inline JSX objects. |
| Database | Supabase (Postgres) | RLS enabled on all tables |
| Auth | Supabase Google OAuth | No email/password |
| AI | Anthropic Claude (claude-opus-4-5) | Used for all three AI calls |
| Hosting | Vercel | Free tier |
| Payments | Stripe | Wired but not activated for new users |
| Analytics | PostHog | Installed, 5 events tracked |
| File extraction | pdfjs-dist + mammoth | Client-side only, no file upload to server |
| Font | Inter Tight (Google Fonts) | Variable `--font-inter-tight` |

---

## Repository Structure

```
/app
  /admin          → Founder dashboard (server component)
  /api
    /chat         → Claude chat API (streaming)
    /create-checkout → Stripe checkout session
    /extract-text → Fallback text extraction (unused)
    /punch-list   → Generate punch list via Claude
    /quick-scan   → Quick scan via Claude
    /validate-code → Access code validation
    /verify-payment → Stripe webhook/verification
  /auth/callback  → Supabase OAuth callback
  /beta           → Beta survey page (client component)
  /contact        → Contact page
  /how-it-works   → How it works page
  /resources      → Resources page (free checklist + Sparkle Dust)
  /session        → THE ENTIRE PRODUCT (client component, ~2200 lines)
  /sessions       → My Sessions history page (client component)
  /terms          → Terms page
  layout.tsx      → Root layout with PHProvider (PostHog) + Nav + Footer
  globals.css     → Design tokens + shared CSS classes
  providers.tsx   → PostHog PHProvider wrapper

/components
  Nav.tsx         → Sticky nav, handles auth state client-side
  NavWrapper.tsx  → Client wrapper for Nav
  Footer.tsx      → Footer
  PersonaCycler.tsx → Animated persona cycling on homepage

/lib
  /supabase
    client.ts     → Browser Supabase client
    server.ts     → Server Supabase client (reads cookies)
    admin.ts      → Service role client (bypasses RLS)

/supabase/migrations
  001–009         → See 03_DATABASE.md
```

---

## The Session Page State Machine

`app/session/page.tsx` is the entire product. It's a `'use client'` component with a `phase` state that drives everything.

**Phases:**
```
'upload'    → File/text upload, quick scan CTA
'scanning'  → Loading state while Claude scans
'results'   → Quick scan results, persona selection cards
'chat'      → Chat with selected persona
'punchlist' → Punch list display, PDF export, feedback
```

**Key state variables:**
```typescript
phase: 'upload' | 'scanning' | 'results' | 'chat' | 'punchlist'
selectedPersona: 'skeptic' | 'slammed' | 'hype' | null
punchlistItems: PunchListItem[] | null
sessionId: string | null          // Supabase sessions row ID
completedSessions: Array<{persona, items}>  // for multi-persona PDF
showAccessGate: boolean           // modal when no access
```

**Phase transitions:**
- Upload → Scanning: user clicks "See what they think"
- Scanning → Results: Claude quick-scan completes
- Results → Chat: user selects a persona (after access check)
- Chat → Punchlist: user clicks "Get my punch list" or "Skip to list"
- Punchlist → Results: user clicks "Try a different seat"
- Any → Upload: user clicks "Upload new training"

---

## Auth Architecture (Important Quirks)

**The core problem:** There is no session refresh middleware. Supabase SSR requires a middleware.ts that reads/refreshes tokens from cookies on every request. Without it, server-side `supabase.auth.getUser()` returns null even for logged-in users.

**The workaround:** Client-side components call `supabase.auth.getSession()` to get the access token, then pass it as `Authorization: Bearer <token>` header to API routes. Server routes check this header first, then fall back to cookies.

**Pattern used in API routes:**
```typescript
const authHeader = request.headers.get('Authorization')
const token = authHeader?.replace('Bearer ', '')
const { data: { user } } = token
  ? await supabase.auth.getUser(token)
  : await supabase.auth.getUser()
```

**Pattern used in client components:**
```typescript
const { data: { session } } = await supabase.auth.getSession()
const res = await fetch('/api/validate-code', {
  headers: {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
  },
  body: JSON.stringify({ code }),
})
```

**The admin dashboard** avoids this entirely by using `ADMIN_SECRET` query param auth and the service role client (bypasses RLS completely).

---

## File Extraction (Client-Side)

All file-to-text extraction happens in the browser. Nothing is uploaded to the server — only extracted text hits the API. This was a deliberate workaround for Vercel's 4.5MB serverless limit.

```typescript
// PDF extraction
const pdfjs = await import('pdfjs-dist')
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

// DOCX extraction
const mammoth = await import('mammoth')
```

The worker file (`pdf.worker.min.mjs`) must be in `/public/`.

---

## AI Calls

Three Claude API calls per full session:

| Call | Route | Model | Purpose |
|---|---|---|---|
| Quick scan | `/api/quick-scan` | claude-opus-4-5 | Analyze training, generate 3 persona previews |
| Chat | `/api/chat` | claude-opus-4-5 | Streaming chat as a persona |
| Punch list | `/api/punch-list` | claude-opus-4-5 | Generate prioritized punch list |

All use claude-opus-4-5. No prompt caching. No model tiering. This is the most expensive config — costs ~$0.28–0.55/session.

The Anthropic API key is in `ANTHROPIC_API_KEY` env var.

---

## PDF Export

`handleDownloadPDF()` in session/page.tsx opens a new browser window, writes an HTML document, and triggers `window.print()`.

**Critical note:** The `</script>` tag inside the template literal must be escaped as `<\/script>` or the TSX parser breaks. This caused a full build failure that was fixed.

```typescript
const html = `...
  <script>window.onload = () => { window.print() }<\/script>
...`
```

---

## PostHog Analytics

Installed in `app/providers.tsx`, wrapped in `app/layout.tsx` via `PHProvider`.

**5 tracked events:**
- `scan_started` — when user clicks "See what they think"
- `persona_selected` — when user picks a persona
- `gate_shown` — when access gate modal appears
- `punchlist_generated` — when punch list renders
- `pdf_downloaded` — when user clicks download
- `feedback_submitted` — when in-app emoji feedback is submitted

**Env vars:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

---

## Supabase Clients — When to Use Which

| Client | File | Use for |
|---|---|---|
| Browser client | `lib/supabase/client.ts` | Client components, auth session reading |
| Server client | `lib/supabase/server.ts` | Server components, API routes (reads cookies) |
| Admin client | `lib/supabase/admin.ts` | Admin dashboard only — uses service role key, bypasses all RLS |

**Never use the admin client in client-side code or expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.**

---

## Known Issues / Technical Debt

1. **No session middleware** — auth is unreliable server-side without `middleware.ts`. Workaround is passing token in headers (implemented in validate-code, not all routes).

2. **No session persistence** — browser refresh during a session loses all state. Everything lives in React state. This is a known roadmap item.

3. **Rate limiting not enforced** — `rate_limits` table exists in DB but is never queried. A heavy user could run unlimited sessions.

4. **Stripe not active for new users** — Stripe is fully wired (`/api/create-checkout`, `/api/verify-payment`) but the checkout button is disabled. Needs env var `NEXT_PUBLIC_BETA_MODE=true` removed or a code change to enable for new users.

5. **`auth.users` signup count** — The admin dashboard uses `admin.auth.admin.listUsers()` to count signups. This is the correct approach with the service role client.

6. **Anonymous sessions** — Sessions from non-logged-in users save with `user_id: null`. They show in admin (service role reads all) but can't be attributed to a specific user for retention tracking.
