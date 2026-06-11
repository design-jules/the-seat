# Pending Tasks — The Seat

*Outstanding work as of June 2026. In priority order.*

---

## Critical — Do Before Sharing With More Users

### 1. Run Migration 009 (beta_survey table)
The `/beta` survey page is live and built, but the `beta_survey` table doesn't exist in production yet. Survey submissions will fail silently until this is run.

**Action:** Go to Supabase dashboard > SQL Editor and run the contents of `supabase/migrations/009_beta_survey.sql`.

```sql
create table if not exists beta_survey (
  id uuid primary key default gen_random_uuid(),
  email text,
  persona_hit_hardest text,
  after_action text,
  realness int check (realness between 1 and 3),
  improvement text,
  would_recommend text,
  pricing text,
  created_at timestamptz default now()
);
alter table beta_survey enable row level security;
create policy "Anyone can submit beta survey"
  on beta_survey for insert with check (true);
create policy "Service role reads beta survey"
  on beta_survey for select using (true);
```

---

### 2. Activate Stripe for New Users
Stripe is fully wired. The checkout flow, verification route, and `approved_via: 'paid'` path are all built. Currently disabled for new users.

**Action:** Find the disabled/hidden Stripe checkout button and enable it. Ensure `STRIPE_PRICE_ID` and live Stripe keys are set in Vercel environment variables (currently using test keys). Confirm the price is set to $19.

**Note:** Implement rate limiting before promoting Stripe publicly (see item 5).

---

### 3. Session Persistence (localStorage)
Browser refresh during a session loses all state. Everything lives in React state. When it refreshes, users lose their work and blame the product.

**Action:** On every state change in `app/session/page.tsx`, write phase, training content, persona, punch list to `localStorage`. On mount, check for saved state and restore. Add a "clear session" button.

---

## Important — Do in Next 30 Days

### 4. Email Follow-Up Sequence
At 24 hours post-session: "How did the review go? Ready to try a different persona?" At Day 7: "Run any training through The Seat this week?"

**Blocked by:** Email capture at punch list completion (currently not implemented). Need to add an optional "email this to me" field at the bottom of the punch list, then wire to Resend for delivery.

---

### 5. Rate Limiting (Wire the Existing Table)
The `rate_limits` table exists in the database but is never queried. Heavy users can run unlimited sessions with no cap. This is a financial risk before any paid tier goes live.

**Action:** At the start of each AI API call (`/api/quick-scan`, `/api/chat`, `/api/punch-list`), read from `rate_limits` for the current user. Increment on completion. Return HTTP 429 with a friendly message when cap is hit. Start at 15 sessions/month.

---

### 6. Shareable Punch List Link
The observed user behavior is: complete session → download PDF → send to team. A native shareable link would make this a product-level feature, not a workaround.

**Action:** Generate a UUID-based `share_token` when a punch list is saved. Store it on the `sessions` row (add column). Build a read-only `/share/[token]` page — no auth required to view. Add a CTA on the share page: "Want to test your training? Try The Seat."

---

### 7. Persona Onboarding Overlay
Users who don't understand Bex mistake her enthusiasm for approval. A dismissable two-sentence intro shown once (first time entering chat phase) would reduce this.

**Action:** Add a `localStorage` flag per persona. On first chat phase entry for a given persona, show an overlay with persona name, archetype, and one-line "what to expect." Dismissable by clicking anywhere.

---

## Known Bugs / Tech Debt

### Auth: No Session Middleware
There is no `middleware.ts` for Supabase session refresh. This means server-side auth is unreliable. Current workaround: pass auth token in `Authorization: Bearer <token>` header from client components to API routes.

**Impact:** Most user-facing flows work around this. The gap could cause silent auth failures in edge cases. A real fix requires adding `middleware.ts` with Supabase SSR session handling.

### Anonymous Sessions Attribution
Sessions from non-logged-in users save with `user_id: null`. They appear in admin dashboard (service role reads all) but can't be attributed to a specific user for retention tracking.

**Impact:** Retention metrics will undercount users who run anonymous sessions. Low priority until analytics data shows this is common.

### Total Signup Count (Admin Dashboard)
The admin dashboard signup count uses `admin.auth.admin.listUsers()`. If this starts returning incorrect numbers, the pagination may need to be handled (it returns up to 1000 users per call by default).

---

## Roadmap Items (See 06_ROADMAP.md for Full Detail)

In rough priority order after the above:

1. Session persistence — localStorage
2. Stripe activation for new users
3. Rate limiting
4. Email follow-up sequence
5. Shareable punch list link
6. Onboarding overlay for personas
7. Team sharing / multi-seat access (after user interviews confirm demand)
8. More personas (after 10 customer interviews define who's missing)

---

## One-Time Tasks

- [ ] Add UTM tracking to "Before You Take a Seat" checklist download link
- [ ] Build simple thank-you page after checklist download with CTA back to `/session`
- [ ] Run 10 customer interviews before 25th user is activated (see 07_STRATEGY.md)
- [ ] Add content type field to session form ("What type of training did you upload?")
- [ ] Set up 24-hour and Day-7 email automations when email capture is live
