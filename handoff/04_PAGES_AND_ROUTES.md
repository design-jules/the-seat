# Pages and API Routes — The Seat

---

## Pages

### `/session` — The Product
`app/session/page.tsx` — `'use client'`, ~2200 lines

The entire product. A state machine with 5 phases. Key functions:

- `extractTextFromFile(file)` — client-side PDF/DOCX extraction (pdfjs-dist, mammoth)
- `saveSession(persona, content, title, confidence)` — inserts to `sessions` table
- `saveConfidenceAfter(sessionId, confidence)` — updates confidence_after
- `savePunchlistItems(sessionId, items)` — inserts to `punch_list_items`
- `handleScan()` — calls `/api/quick-scan`, transitions to results
- `proceedWithPersona(persona, skipToList)` — saves session, starts chat or skips to punch list
- `handleInlineCode()` — validates code (sends auth token in header)
- `handleGateCode()` — validates code from access gate modal (also sends auth token)
- `handlePunchlist()` — calls `/api/punch-list`
- `handleDownloadPDF()` — opens print window with multi-persona summary
- `handleFeedbackSubmit()` — saves emoji feedback to `feedback` table

**Access control flow:**
1. User clicks a persona
2. `handlePersonaSelect()` checks sessionStorage for `'the-seat-access'`
3. If not found, checks if user is in `approved_users` (Supabase query)
4. If not approved, shows `showAccessGate` modal
5. User enters code → `handleGateCode()` → `/api/validate-code`
6. On success: sessionStorage set, gate dismissed, `proceedWithPersona()` called

### `/admin` — Founder Dashboard
`app/admin/page.tsx` — Server component, `force-dynamic`

Protected by: `?key=ADMIN_SECRET` query param.
Uses `createAdminClient()` (service role — bypasses all RLS).

Shows:
- 6 metric cards (have access, activated, punch lists, returned, activation rate, retention rate)
- Persona session counts
- Access code status (generic/claimed/unclaimed counts)
- Unclaimed codes table (actual code strings)
- Recent 10 sessions with email lookup
- Recent feedback (emoji ratings + comments)
- Beta survey responses

### `/beta` — Beta Survey
`app/beta/page.tsx` — `'use client'`

6-question survey for beta users. Submits to `beta_survey` table via Supabase client.
Questions: persona usefulness, after-action, realness (emoji), open improvement, recommend intent, pricing.
**Requires migration 009 to be run before going live.**

### `/sessions` — My Sessions History
`app/sessions/page.tsx` — `'use client'`

Checks auth via `supabase.auth.getUser()`. If not logged in, shows sign-in prompt.
Fetches user's sessions ordered by date, with punch list item counts.

### `/` — Homepage
`app/page.tsx`

Hero, PersonaCycler, 3 real testimonials, How It Works, CTA.

### `/how-it-works` — How It Works
Static page explaining the product.

### `/resources` — Resources
Free checklist ("Before You Take a Seat" PDF) + Sparkle Dust (coming soon).

### `/access` — Access/Pricing Page
Shows $19/session price, Stripe checkout button.

### `/contact` — Contact
Contact form via FormSubmit.co.

---

## API Routes

### `POST /api/validate-code`
Validates an access code. Handles three code states (generic, unclaimed, claimed).
On success for logged-in users: upserts to `approved_users`.
**Must receive auth token in `Authorization: Bearer <token>` header** for logged-in user detection (no session middleware).

Key response shapes:
```json
{ "valid": true }
{ "valid": false, "message": "That code didn't work. Try again?" }
{ "valid": false, "requiresLogin": true, "message": "Sign in first..." }
```

### `POST /api/quick-scan`
Sends training content to Claude. Returns persona preview snippets.
Input: `{ trainingContent: string }`
Output: `{ skepticPreview, slammedPreview, hypePreview, title }`

### `POST /api/chat`
Streaming Claude chat as a persona.
Input: `{ messages, persona, trainingContent }`
Output: Server-Sent Events stream

### `POST /api/punch-list`
Generates prioritized punch list via Claude.
Input: `{ messages, persona, trainingContent }`
Output: `{ items: PunchListItem[], title }`
```typescript
type PunchListItem = {
  priority: 'DO FIRST' | 'DO NEXT' | 'NICE TO HAVE'
  title: string
  detail: string
}
```

### `POST /api/create-checkout`
Creates Stripe checkout session.
Returns: `{ url: string }` (redirect URL to Stripe)

### `POST /api/verify-payment`
Verifies Stripe payment and grants access.
Adds user to `approved_users` with `approved_via: 'paid'`.

### `GET /auth/callback`
Supabase OAuth callback. Exchanges code for session, redirects to `/session`.

---

## Key Components

### `Nav.tsx`
Sticky dark-green nav. Client component that reads auth state.
Shows "My Sessions" link when user is logged in.
Shows user's first name + sign out when authenticated.

### `PersonaCycler.tsx`
Animated cycling through the three personas on the homepage.

### `providers.tsx`
PostHog `PHProvider` — wraps the app in `app/layout.tsx`.
Initializes PostHog with `NEXT_PUBLIC_POSTHOG_KEY`.
