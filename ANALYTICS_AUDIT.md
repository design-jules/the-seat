# Analytics Audit — The Seat

*Written June 2026. CTO + Product Lead perspective.*

---

## Executive Summary

The Seat has zero client-side analytics. No page views. No event tracking. No funnels. No session recordings.

However, Supabase contains more signal than most founders realize. Six tables, properly queried, can answer 7 of the 9 questions below — right now, today, with no new code. The remaining two (site visitors, uploads) require a small instrumentation effort.

The recommended path: **use Supabase for the founder dashboard, add PostHog for the funnel gaps, and ship both in one day.**

---

## Metric-by-Metric Audit

---

### 1. Site Visitors

**Can we measure it today?** No.

**Where would the data be?** Nowhere. There is no analytics tool installed. Vercel's built-in analytics tracks web vitals but not unique visitors, page views, or sessions.

**What SQL would retrieve it?** None — the data doesn't exist.

**Gaps:** Complete blind spot. We have no idea how many people visit the homepage, bounce immediately, or read the How It Works page and leave. We don't know if the testimonials section is driving scroll depth or if anyone is even reading the resources page.

**Fix:** Install PostHog (free, 1M events/month). Add `posthog.init()` to `app/layout.tsx`. Automatic pageview tracking from that point forward. Effort: 30 minutes.

---

### 2. Signups (Account Creations)

**Can we measure it today?** Yes — partially.

**Where is the data stored?** `auth.users` (Supabase managed table). Contains `id`, `email`, `created_at`, `last_sign_in_at`, `email_confirmed_at`.

**SQL to retrieve it:**
```sql
-- Total signups
SELECT COUNT(*) AS total_signups
FROM auth.users;

-- Signups over time (weekly)
SELECT
  date_trunc('week', created_at) AS week,
  COUNT(*) AS signups
FROM auth.users
GROUP BY week
ORDER BY week DESC;

-- Signups vs confirmed (completed email verification)
SELECT
  COUNT(*) AS total,
  COUNT(email_confirmed_at) AS confirmed,
  COUNT(*) - COUNT(email_confirmed_at) AS unconfirmed
FROM auth.users;
```

**Gaps:**
- We don't know the signup source (did they come from the homepage, a shared PDF, a LinkedIn post?). No UTM data is captured.
- Google OAuth users and email/password users look the same in this table — no differentiation.
- "Signup" conflates someone who created an account with someone who has access. These are different things (see `approved_users` below).

---

### 3. Access Code Usage

**Can we measure it today?** Yes — fully.

**Where is the data stored?** `access_codes` table. Fields: `code`, `email`, `note`, `used_at`.

**SQL to retrieve it:**
```sql
-- All codes: claimed vs unclaimed vs generic
SELECT
  code,
  note,
  email,
  used_at,
  CASE
    WHEN note = 'generic' THEN 'generic (reusable)'
    WHEN email IS NOT NULL THEN 'claimed'
    ELSE 'unclaimed'
  END AS status
FROM access_codes
ORDER BY used_at DESC NULLS LAST;

-- Summary counts
SELECT
  COUNT(*) FILTER (WHERE note = 'generic') AS generic_codes,
  COUNT(*) FILTER (WHERE email IS NOT NULL AND note IS DISTINCT FROM 'generic') AS claimed_codes,
  COUNT(*) FILTER (WHERE email IS NULL AND note IS DISTINCT FROM 'generic') AS unclaimed_codes
FROM access_codes;

-- Code claim rate over time
SELECT
  date_trunc('week', used_at) AS week,
  COUNT(*) AS codes_claimed
FROM access_codes
WHERE used_at IS NOT NULL
  AND note IS DISTINCT FROM 'generic'
GROUP BY week
ORDER BY week DESC;
```

**Gaps:**
- Generic codes (TAKEASEAT, SEAT158) don't record usage — `email` and `used_at` stay null. We have no idea how many people have used TAKEASEAT.
- We don't know if a user who claimed a code then actually used the product (they could claim and never complete a session).

---

### 4. Approved Users

**Can we measure it today?** Yes — fully.

**Where is the data stored?** `approved_users` table. Fields: `user_id`, `approved_via`, `approved_at`.

**SQL to retrieve it:**
```sql
-- Total approved users by method
SELECT
  approved_via,
  COUNT(*) AS count
FROM approved_users
GROUP BY approved_via;

-- Approved users over time
SELECT
  date_trunc('week', approved_at) AS week,
  COUNT(*) AS newly_approved
FROM approved_users
GROUP BY week
ORDER BY week DESC;

-- Approved users who have also created a session (activated)
SELECT
  COUNT(DISTINCT au.user_id) AS approved_and_activated
FROM approved_users au
JOIN sessions s ON s.user_id = au.user_id;

-- Approved but never activated (dead weight)
SELECT
  COUNT(DISTINCT au.user_id) AS approved_never_used
FROM approved_users au
LEFT JOIN sessions s ON s.user_id = au.user_id
WHERE s.id IS NULL;
```

**Gaps:**
- `approved_via` only captures 'code' or 'paid' — not which specific code was used. Can't attribute TAKEASEAT vs SEAT158 vs a personal code.
- Generic code users who weren't logged in get approved_users written only if they were logged in at code entry time. An anonymous TAKEASEAT user has no record in `approved_users`.

---

### 5. Uploads (Training Content Submitted)

**Can we measure it today?** No — not directly.

**Where would the data be?** The `sessions` table has `training_topic` (first 100 chars of content) and `training_title`, but sessions are only created when a user *selects a persona* — not when they upload or scan. The upload and scan phases are completely invisible to the database.

This means: if 100 people upload a file and 30 select a persona, we only see 30 in the DB. The 70 who dropped off at scan results are invisible.

**SQL for what we have (persona selections as a proxy for uploads):**
```sql
-- Proxy: sessions started (persona selected), by date
SELECT
  date_trunc('day', created_at) AS day,
  COUNT(*) AS sessions_started
FROM sessions
GROUP BY day
ORDER BY day DESC;

-- Content by type (we can infer from training_topic text)
SELECT
  training_title,
  training_topic,
  created_at
FROM sessions
ORDER BY created_at DESC
LIMIT 20;
```

**Gaps:** We have no visibility into the upload → scan → results funnel. This is the biggest instrumentation gap in the product. We don't know how many people upload and then never select a persona.

**Fix:** Add a `scan_events` table with `session_token` (anonymous), `created_at`, `content_length_chars`, `file_type`. Write to it when scan starts. Join on session later if the user proceeds. Effort: 2 hours.

---

### 6. Persona Conversations

**Can we measure it today?** Partially.

**Where is the data stored?** `sessions` table. Each row = one persona conversation (persona, user_id, created_at). No message content or message count is stored.

**SQL to retrieve it:**
```sql
-- Sessions by persona
SELECT
  persona,
  COUNT(*) AS session_count
FROM sessions
GROUP BY persona
ORDER BY session_count DESC;

-- Persona distribution over time
SELECT
  date_trunc('week', created_at) AS week,
  persona,
  COUNT(*) AS count
FROM sessions
GROUP BY week, persona
ORDER BY week DESC;

-- Average sessions per user (only for logged-in users)
SELECT
  AVG(session_count) AS avg_sessions_per_user
FROM (
  SELECT user_id, COUNT(*) AS session_count
  FROM sessions
  WHERE user_id IS NOT NULL
  GROUP BY user_id
) sub;
```

**Gaps:**
- No message count per session — we don't know if people had 2 exchanges or 12.
- No conversation content stored (by design, for privacy, but limits analysis).
- Anonymous sessions (user_id IS NULL) can't be tracked across page loads.
- We can't tell if a "session" involved any actual conversation or if the user hit "get my punch list" immediately (skip-to-list path).

---

### 7. Punch List Generation

**Can we measure it today?** Yes — fully. This is the most reliable metric in the system.

**Where is the data stored?** `punch_list_items` table. Each item has `session_id`, `priority`, `title`, `detail`, `created_at`.

**SQL to retrieve it:**
```sql
-- Total punch lists generated (sessions that have at least one item)
SELECT COUNT(DISTINCT session_id) AS punch_lists_generated
FROM punch_list_items;

-- Punch lists per week
SELECT
  date_trunc('week', created_at) AS week,
  COUNT(DISTINCT session_id) AS punch_lists
FROM punch_list_items
GROUP BY week
ORDER BY week DESC;

-- Average items per punch list
SELECT AVG(item_count) AS avg_items
FROM (
  SELECT session_id, COUNT(*) AS item_count
  FROM punch_list_items
  GROUP BY session_id
) sub;

-- Priority distribution
SELECT
  priority,
  COUNT(*) AS total_items,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct
FROM punch_list_items
GROUP BY priority
ORDER BY total_items DESC;

-- Sessions with a punch list (activated users)
SELECT
  s.user_id,
  s.persona,
  s.created_at,
  COUNT(p.id) AS items_generated
FROM sessions s
JOIN punch_list_items p ON p.session_id = s.id
GROUP BY s.user_id, s.persona, s.created_at
ORDER BY s.created_at DESC;
```

**Gaps:**
- We don't know if users read the punch list or immediately closed the tab.
- We don't know if users acted on any punch list items.
- PDF download is not logged anywhere.

---

### 8. Returning Users

**Can we measure it today?** Partially — for logged-in users only.

**Where is the data stored?** `sessions` table, cross-referenced with `auth.users.last_sign_in_at`.

**SQL to retrieve it:**
```sql
-- Users with more than one session (returning)
SELECT
  user_id,
  COUNT(*) AS total_sessions,
  MIN(created_at) AS first_session,
  MAX(created_at) AS latest_session,
  MAX(created_at) - MIN(created_at) AS time_between_first_and_last
FROM sessions
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY total_sessions DESC;

-- Return rate: users who came back within 7 days
WITH first_sessions AS (
  SELECT user_id, MIN(created_at) AS first_session
  FROM sessions
  WHERE user_id IS NOT NULL
  GROUP BY user_id
),
return_sessions AS (
  SELECT s.user_id
  FROM sessions s
  JOIN first_sessions f ON f.user_id = s.user_id
  WHERE s.created_at > f.first_session
    AND s.created_at <= f.first_session + INTERVAL '7 days'
)
SELECT
  COUNT(DISTINCT f.user_id) AS total_users,
  COUNT(DISTINCT r.user_id) AS returned_within_7_days,
  ROUND(COUNT(DISTINCT r.user_id) * 100.0 / NULLIF(COUNT(DISTINCT f.user_id), 0), 1) AS day7_return_rate_pct
FROM first_sessions f
LEFT JOIN return_sessions r ON r.user_id = f.user_id;
```

**Gaps:**
- Anonymous sessions (user_id IS NULL) cannot be tracked across page loads. An anonymous user who returns is indistinguishable from a new user.
- `last_sign_in_at` in auth.users updates on every login, not every tool session — so it's not a reliable session proxy.

---

### 9. Repeat Sessions

**Can we measure it today?** Yes — for logged-in users.

**Where is the data stored?** `sessions` table (multiple rows per user_id).

**SQL to retrieve it:**
```sql
-- Full repeat session distribution
SELECT
  session_count,
  COUNT(*) AS users_with_that_many_sessions
FROM (
  SELECT user_id, COUNT(*) AS session_count
  FROM sessions
  WHERE user_id IS NOT NULL
  GROUP BY user_id
) sub
GROUP BY session_count
ORDER BY session_count;

-- Persona sequence: what do users do after their first persona?
WITH ranked AS (
  SELECT
    user_id,
    persona,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS session_num
  FROM sessions
  WHERE user_id IS NOT NULL
)
SELECT
  first.persona AS first_persona,
  second.persona AS second_persona,
  COUNT(*) AS occurrences
FROM ranked first
JOIN ranked second ON second.user_id = first.user_id AND second.session_num = 2
WHERE first.session_num = 1
GROUP BY first.persona, second.persona
ORDER BY occurrences DESC;
```

**Gaps:** Same as returning users — anonymous sessions are invisible.

---

## Summary Table

| Metric | Measurable Today? | Data Source | Quality |
|---|---|---|---|
| Site visitors | ❌ No | — | None |
| Signups | ✅ Yes | auth.users | Good |
| Access code usage | ✅ Yes (named codes only) | access_codes | Partial |
| Approved users | ✅ Yes | approved_users | Good |
| Uploads | ❌ No | sessions (proxy only) | Weak proxy |
| Persona conversations | ✅ Partial | sessions | Partial |
| Punch list generation | ✅ Yes | punch_list_items | Good |
| Returning users | ✅ Partial (logged-in only) | sessions | Partial |
| Repeat sessions | ✅ Partial (logged-in only) | sessions | Partial |

---

## Founder Dashboard

A single Supabase SQL view or a private Next.js admin page at `/admin` (protected by checking `user.email === 'jules.kirkham@gmail.com'`).

### Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  THE SEAT — BETA DASHBOARD              Last updated: [now]     │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│  HAVE ACCESS │  ACTIVATED   │  PUNCH LISTS │  RETURNED         │
│              │              │              │                   │
│     [n]      │    [n]       │    [n]       │    [n]            │
│  approved    │  ran ≥1      │  generated   │  ran ≥2           │
│  users       │  session     │  ≥1 list     │  sessions         │
├──────────────┴──────────────┴──────────────┴───────────────────┤
│  ACTIVATION RATE            │  RETENTION RATE (Day 7)          │
│  activated / have access    │  returned / activated            │
│         [n%]                │          [n%]                    │
├─────────────────────────────┴──────────────────────────────────┤
│  RECENT SESSIONS (last 10)                                      │
│  date | persona | has_punchlist | user (anon or email)          │
├────────────────────────────────────────────────────────────────┤
│  BETA REQUESTS WAITING      │  CODES (unclaimed)               │
│  [n] emails waiting         │  [n] of [total] unused           │
└────────────────────────────────────────────────────────────────┘
```

### Master Dashboard Query

Run this in Supabase SQL editor to see everything at once:

```sql
-- ── 1. How many people have access? ────────────────────────────
SELECT COUNT(*) AS have_access FROM approved_users;

-- ── 2. How many activated? (ran at least one session) ──────────
SELECT COUNT(DISTINCT s.user_id) AS activated
FROM sessions s
JOIN approved_users au ON au.user_id = s.user_id;

-- ── 3. How many generated a punch list? ────────────────────────
SELECT COUNT(DISTINCT s.user_id) AS generated_punchlist
FROM sessions s
JOIN punch_list_items p ON p.session_id = s.id
JOIN approved_users au ON au.user_id = s.user_id;

-- ── 4. How many returned? (2+ sessions) ────────────────────────
SELECT COUNT(*) AS returned
FROM (
  SELECT user_id
  FROM sessions
  WHERE user_id IS NOT NULL
  GROUP BY user_id
  HAVING COUNT(*) >= 2
) sub;

-- ── 5. Activation rate ─────────────────────────────────────────
WITH access AS (SELECT COUNT(*) AS n FROM approved_users),
     activated AS (
       SELECT COUNT(DISTINCT s.user_id) AS n
       FROM sessions s
       JOIN approved_users au ON au.user_id = s.user_id
     )
SELECT
  activated.n AS activated,
  access.n AS have_access,
  ROUND(activated.n * 100.0 / NULLIF(access.n, 0), 1) AS activation_rate_pct
FROM access, activated;

-- ── 6. Retention rate (returned within 14 days of first session)
WITH first AS (
  SELECT user_id, MIN(created_at) AS first_at
  FROM sessions WHERE user_id IS NOT NULL GROUP BY user_id
),
returned AS (
  SELECT s.user_id
  FROM sessions s JOIN first f ON f.user_id = s.user_id
  WHERE s.created_at > f.first_at
    AND s.created_at <= f.first_at + INTERVAL '14 days'
)
SELECT
  COUNT(DISTINCT f.user_id) AS activated_users,
  COUNT(DISTINCT r.user_id) AS returned_within_14d,
  ROUND(COUNT(DISTINCT r.user_id)*100.0/NULLIF(COUNT(DISTINCT f.user_id),0),1) AS retention_rate_pct
FROM first f LEFT JOIN returned r ON r.user_id = f.user_id;

-- ── 7. Recent sessions ─────────────────────────────────────────
SELECT
  s.created_at,
  s.persona,
  u.email,
  s.training_title,
  EXISTS (SELECT 1 FROM punch_list_items p WHERE p.session_id = s.id) AS has_punchlist
FROM sessions s
LEFT JOIN auth.users u ON u.id = s.user_id
ORDER BY s.created_at DESC
LIMIT 10;

-- ── 8. Beta requests waiting for codes ────────────────────────
SELECT COUNT(*) AS waiting, MIN(created_at) AS oldest_request
FROM beta_requests;

-- ── 9. Codes status ────────────────────────────────────────────
SELECT
  COUNT(*) FILTER (WHERE note = 'generic') AS generic,
  COUNT(*) FILTER (WHERE email IS NOT NULL AND note IS DISTINCT FROM 'generic') AS claimed,
  COUNT(*) FILTER (WHERE email IS NULL AND note IS DISTINCT FROM 'generic') AS unclaimed
FROM access_codes;
```

---

## Recommended Analytics Implementation

### What to Build (in order)

**Day 1 — Supabase dashboard (no new code)**
Run the queries above in Supabase SQL editor. Save them as named queries. Bookmark the page. You have a working dashboard today. Effort: 1 hour.

**Day 1–2 — PostHog (pageviews + 5 critical events)**

Install:
```bash
npm install posthog-js
```

Add to `app/layout.tsx`:
```tsx
// app/providers.tsx  (new file)
'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://app.posthog.com',
      capture_pageview: true,
    })
  }, [])
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
```

Track exactly 5 events in `session/page.tsx`:
```tsx
import posthog from 'posthog-js'

posthog.capture('scan_started')           // when "See what they think" clicked
posthog.capture('persona_selected', { persona })  // when persona card clicked
posthog.capture('chat_message_sent', { count: exchangeCount })
posthog.capture('punchlist_generated', { persona, item_count: data.items.length })
posthog.capture('pdf_downloaded', { personas_completed: completedSessions.length })
```

That's it. Five events. You'll be able to see where people drop off, which persona they choose, and whether they reach the punch list. Effort: 2–3 hours.

**Day 3 — Email capture at punch list completion**
Add a single text input + submit at the bottom of the punch list phase:
```
"Want this emailed to you? Drop your address."
```
Write the email to a new `punch_list_emails` Supabase table. Send via Resend (free tier, 100 emails/day). This gives you:
- Email addresses of your most activated users
- A follow-up hook at 24 hours and 7 days
- The start of an email list

Effort: 3–4 hours.

**Total effort for a working analytics stack: under one day.**

---

## What NOT to Build

- A custom admin dashboard in Next.js (Supabase SQL editor is enough for now)
- Mixpanel or Amplitude (PostHog free tier is sufficient and simpler)
- Heatmaps (not yet — not enough traffic to be meaningful)
- A/B testing infrastructure (not yet — not enough users)
- Server-side event tracking (client-side PostHog captures what you need)

---

## Feedback Collection Plan

### The Goal

Learn four things from every beta user:
1. What confused them
2. What they liked
3. Whether they'd use it again
4. Whether they'd pay (and how much)
5. What almost stopped them

### Recommended Implementation (Under One Day)

**Option 1: Inline micro-survey at punch list completion (2 hours)**

After the punch list renders, below the PDF download button, add:

```
How was that? [😕] [😐] [😊] [🤩]
```

On click, show a single open text field: "Tell us more — what should we know?"

Write to a `feedback` Supabase table: `{ rating: 1-4, comment: text, session_id, created_at }`.

This captures feedback at peak value moment (user has just seen their punch list) with zero friction. One click. Optional comment. Done.

**Option 2: Tally.so form linked from the punch list (30 minutes)**

Create a free Tally form with 5 questions:
- On a scale of 1–5, how useful was this session?
- What was most useful?
- What confused you or almost stopped you?
- Would you use this again before your next review?
- Would you pay for this? If yes, how much per month would feel fair?

Add a text link at the bottom of the punch list: "2 minutes to make this better → [share feedback]"

Tally is free, no code, collects structured data, and sends you an email on every submission.

**Option 3: Direct outreach (no code, immediate)**

Email the three testimonial-givers and any other known beta users with:

> "Hi [name] — you used The Seat recently and I'd love 20 minutes of your time. I'm trying to understand what's working and what isn't. Would you be up for a quick call this week?"

Five calls will teach you more than 50 survey responses. Do this first, before building anything.

**Recommendation:** Do Option 3 this week. Add Option 2 this week (30 minutes). Build Option 1 in two weeks once you've done calls and know what questions matter most.

---

*This document should be updated whenever a new metric becomes available or a new gap is discovered.*
