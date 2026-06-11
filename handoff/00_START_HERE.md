# The Seat — Agent Handoff Package

**Start here. Read this first.**

---

## What This Is

The Seat is a pre-review pressure-testing tool for L&D designers. You upload training content, pick a learner persona, and get feedback from their point of view — then receive a prioritized punch list of what to fix. Live at **theseatmethod.com**.

Built by: **Julie Kirkham** (founder, L&D designer, jules.kirkham@gmail.com)

---

## Files In This Handoff Package

| File | What's in it |
|---|---|
| `00_START_HERE.md` | This file — orientation and quick facts |
| `01_PRODUCT.md` | What the product is, the three personas, business model, competitive landscape |
| `02_TECHNICAL.md` | Full tech stack, architecture decisions, known gotchas, auth quirks |
| `03_DATABASE.md` | All 9 migrations, current schema, RLS policies, what each table is for |
| `04_PAGES_AND_ROUTES.md` | Every page and API route, what it does, key code patterns |
| `05_DESIGN_SYSTEM.md` | Colors, fonts, CSS classes, spacing patterns from globals.css |
| `06_ROADMAP.md` | What's been built, what's next, what to never build |
| `07_STRATEGY.md` | Metrics, GTM plan, customer learnings, analytics audit |
| `08_WRITING_STYLE.md` | Julie's voice and tone — use this for any copy |
| `09_ENV_VARS.md` | All environment variables required |
| `10_PENDING_TASKS.md` | Outstanding tasks and known bugs |

---

## 60-Second Orientation

**Tech stack:** Next.js 14 App Router, TypeScript, Supabase (auth + DB), Vercel (hosting), Anthropic Claude API (claude-opus-4-5), Stripe (wired, not active), PostHog (analytics)

**The whole product lives in one route: `/session`** — a client-side state machine with 5 phases: `upload → scanning → results → chat → punchlist`

**Three AI personas powered by Claude:**
- Dana — The Skeptic (skeptical, dry, needs convincing)
- Marcus — The Slammed (busy, no time, needs utility)
- Bex — The Hype (loves everything, dangerously enthusiastic)

**Access is code-gated.** Users enter an access code or pay via Stripe. Generic codes (TAKEASEAT) let anyone in. Named codes are tied to specific users.

**Auth:** Supabase Google OAuth. No session middleware — auth token must be passed in `Authorization: Bearer <token>` header for server-side routes. This is a known architectural gap.

**Admin dashboard:** `/admin?key=ADMIN_SECRET` — server-side page using service role key to bypass RLS.

**Beta survey:** `/beta` — 6-question survey for beta users, results visible in admin dashboard.

---

## The Three Most Important Files

1. `app/session/page.tsx` — 2200 lines, the entire product. Client component (`'use client'`).
2. `app/admin/page.tsx` — founder dashboard, server component using service role key.
3. `app/api/validate-code/route.ts` — access code validation + `approved_users` insert.

---

## Currently Live and Working

- Session flow (upload → chat → punchlist → PDF download)
- Access code gate (both generic and named codes)
- Admin dashboard at `/admin?key=SECRET`
- My Sessions page at `/sessions`
- Beta survey at `/beta`
- PostHog analytics (5 events tracked)
- In-app emoji feedback after punch list
- Beta survey responses visible in admin dashboard

---

## What Still Needs Doing

See `10_PENDING_TASKS.md` for the full list. Most critical:
1. Run migration 009 in Supabase SQL editor (beta_survey table)
2. Activate Stripe for new users (currently disabled)
3. Session persistence (browser refresh loses all work)
4. Rate limiting (table exists, logic not wired)
