# Product Roadmap — The Seat

*Source: ROADMAP.md, June 2026*

---

## Priority Framework

Every item scored on:
- **Customer value** — Does this make the product meaningfully better?
- **Business value** — Does this move revenue, retention, or learning?
- **Engineering effort** — S = under 1 day, M = 2–5 days, L = 1–2 weeks, XL = 2+ weeks
- **Risk** — What breaks if done wrong?

**Tiers:** Now / Soon (30 days) / Later / Probably Never

---

## NOW — Do Before Anything Else

### Analytics: PostHog + 5 Core Events (DONE)
Installed in `app/providers.tsx`. 5 events tracked: `scan_started`, `persona_selected`, `gate_shown`, `punchlist_generated`, `pdf_downloaded`.

### Session Persistence (localStorage)
Browser refresh during a session loses all work. High churn risk. Store phase, training content, persona, punch list to localStorage on every state change. Restore on mount. Add a "clear session" button. Effort: S (3–4 hrs).

### My Sessions Page (DONE)
Built at `/sessions`. Shows session history, persona dots, punch list item counts.

### Inline Feedback (DONE)
Emoji rating + optional comment at bottom of punch list. Saves to `feedback` table.

### Stripe Activation for New Users
Stripe is fully wired. Beta cohort stays free. New users pay. The only task: remove the button disable, set live price in env var, turn it on. Target: $19/session first, then test $29/month after 10 conversions.

---

## SOON — Next 30 Days

### Email Follow-Up at 24 Hours and Day 7
24hr: "How did the review go? Ready to try a different persona?" Day 7: "Run any training through The Seat this week?" Requires email capture at punch list + Resend for delivery.

### Onboarding: Persona Explainers Before Chat
Two-sentence persona intro, shown once (localStorage flag), dismissable. Reduces "Bex confusion" — users who don't understand Bex mistake her enthusiasm for approval. Effort: S.

### Shareable Punch List Link
Most observed behavior: complete session → download PDF → send to team. A shareable link (no login required for recipient) makes this native. UUID-based URL, read-only `/share/[token]` page with CTA back to The Seat. This is the viral loop. Effort: M (3–4 days).

### Rate Limiting (Wire the Existing Table)
`rate_limits` table exists in DB, never queried. Heavy user on $29/month could cost more in API fees than they paid. Must be done before Stripe is promoted publicly. Cap: 15 sessions/month on paid tier. Effort: S–M.

---

## LATER — Validate Before Building

### Team Sharing / Multi-Seat Access
The sharing behavior is already happening informally. One team admin, multiple users under one account, shared session history. **Do user interviews first** — need 3 people to confirm the team use case and at least one saying "I'd pay more for team access." Effort: XL.

### More Personas
Do this after 10 customer interviews. Let users tell you who is missing from the room. When users describe specific archetypes they need ("the executive sponsor," "the complete beginner"), those are design briefs. Don't build the next persona without one.

**Expansion directions:**
- Archetypes by industry (compliance, sales enablement, leadership dev each have distinct learner types)
- Custom persona builder for enterprise
- Named personas submitted by community, validated by Julie

### Email Sequence Automation
Wait until at least 20 activated users. 5 people is a conversation, not automation.

### Articulate/Rise Integration
Build when 500 users regularly use those tools and ask for it.

---

## PROBABLY NEVER

**An AI-powered training builder.** "What if The Seat could also build the training?" is a different product, different market, different company. The Seat's power comes from being a feedback tool. Mixing them risks losing the identity.

**A community platform.** Build community through Julie's content and voice. If a community emerges organically, give it a home. Don't build the home first.

**A mobile app.** Build when mobile sessions are a meaningful share of traffic and users complain about the web experience.

---

## 90-Day Milestones

| Milestone | Target | What It Proves |
|---|---|---|
| First paying user | Week 3 | People will pay |
| 5 user interviews completed | Week 3 | We know why they use it |
| Day-7 return rate >20% | Day 30 | Product creates repeating behavior |
| $500 MRR | Day 45 | Revenue is real |
| Shareable punch list live | Day 45 | Viral loop is open |
| Team pricing conversations | Day 60 | Enterprise path validated or ruled out |
| $2,000 MRR | Day 90 | PMF trajectory is positive |

---

## Next 2 Weeks (Strict Priority)

1. Turn on Stripe for new users (Day 7)
2. Session persistence in localStorage (Day 2)
3. Direct outreach to 5 beta users for 20-minute calls (ongoing)
4. Email follow-up sequence (after Stripe is live)
5. Shareable punch list link
6. Rate limiting (before Stripe is promoted)
