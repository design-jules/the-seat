# Product Roadmap — The Seat

*Written June 2026. Perspective: Product Lead, CTO, VP Marketing, Customer Advisory Board.*
*Objective: Reach product-market fit as fast as possible. Prioritize learning over features.*

---

## Framework

Every item is scored on four dimensions:

- **Customer value:** Does this make the product meaningfully better for the user?
- **Business value:** Does this move revenue, retention, or learning?
- **Engineering effort:** How long does it actually take? (S = under 1 day, M = 2–5 days, L = 1–2 weeks, XL = 2+ weeks)
- **Risk:** What breaks if we do this wrong?

**Priority tiers:**
- **Now:** Do before anything else. Existential gaps or immediate revenue.
- **Soon:** Do in the next 30 days. Meaningful impact on PMF trajectory.
- **Later:** Real value, but requires either more users or more validated assumptions.
- **Probably Never:** Sounds good, breaks focus.

---

## The 10 Roadmap Items

---

### 1. Analytics: PostHog + 5 Core Events

**Customer value:** None directly. Invisible to users.
**Business value:** 🔴 Critical. Right now every product decision is a guess. Without knowing where users drop off, which persona they choose, and whether they reach the punch list, we cannot improve the product or justify any investment decision.
**Engineering effort:** S (2–3 hours)
**Risk:** Low. PostHog is a mature tool. Adding 5 event calls to session/page.tsx is safe.
**Priority: NOW — do this before anything else.**

What to track: `scan_started`, `persona_selected`, `punchlist_generated`, `pdf_downloaded`, `gate_shown`. PageView tracking automatic.

---

### 2. Session Persistence (localStorage)

**Customer value:** High. Right now a browser refresh during a session loses all work. This happens. When it does, users blame the product, not their browser. One lost session is a churned user.
**Business value:** Medium. Reduces a silent churn event that we currently can't even see in data.
**Engineering effort:** S (3–4 hours). Save phase, training content, persona, punch list to localStorage on every state change. Restore on mount.
**Risk:** Low-medium. Stale data from a previous session could cause confusion if the code doesn't handle it carefully. Add a "clear session" button.
**Priority: NOW.**

---

### 3. Fix "My Sessions" Dead Link

**Customer value:** High. Every logged-in user sees "My Sessions" in the nav. It goes nowhere. This is a broken promise on every return visit and a trust erosion event precisely when we need trust most.
**Business value:** High. Session history is a retention hook — users come back to reference past reviews, see their progress, and run new sessions.
**Engineering effort:** M (2–3 days). The data is all in Supabase. Build a simple list page: session date, persona icon, training title, punch list preview, link to re-view. No new DB queries needed — just a UI over existing data.
**Risk:** Low. Read-only page over existing data.
**Priority: NOW.**

---

### 4. Inline Feedback Micro-Survey

**Customer value:** Low directly. Users don't benefit from this.
**Business value:** 🔴 Critical. We have three testimonials and zero structured data about what users think, what confused them, or whether they'd pay. A four-emoji rating at the bottom of the punch list with an optional text field gives us feedback at the highest-value moment in the product. Costs nothing to read.
**Engineering effort:** S (2 hours). Tally.so form takes 30 minutes. Inline Supabase write takes 2 hours.
**Risk:** None.
**Priority: NOW — the 30-minute Tally version first, then build the inline version.**

---

### 5. Stripe Activation for New Users

**Customer value:** None (users would prefer free).
**Business value:** 🔴 Existential. We have no revenue. We don't know if people will pay. Every week that passes without activating payments is a week of free usage that trains users to expect free. The beta cohort stays free. New users pay.
**Engineering effort:** S–M (1 day). Stripe is already fully wired. The checkout flow, verification route, and `approved_via: 'paid'` path are all built. The only task is: remove the Stripe button disable, set a live price in the env var, and turn it on.
**Risk:** Medium. We may see conversion go to zero, which is painful but important to know. We need to be ready to learn from that.
**Priority: NOW — within two weeks.**

The price to test first: **$19/session**. After 10 conversions (or non-conversions), test a $29/month subscription. Don't pick before testing.

---

### 6. Email Follow-Up at 24 Hours and Day 7

**Customer value:** Medium. A well-timed "how did the review go?" email feels like genuine interest, not marketing. It also reminds users to come back.
**Business value:** High. This is the lowest-cost retention mechanism available. One email at 24 hours ("how did the review go? Ready to try a different persona?") and one at Day 7 ("run any training through The Seat this week?"). No complex automation needed — Resend + a Supabase cron job or a manual batch send for now.
**Engineering effort:** S–M (1 day). Email capture at punch list → Resend for delivery → two-email sequence.
**Risk:** Low. Unsubscribe clearly. Don't send more than 2 emails without another session.
**Priority: SOON (within 30 days).**

---

### 7. Onboarding: Persona Explainers Before Chat

**Customer value:** Medium-high. Users who understand Dana before they chat with her have a better, more useful conversation. Users who don't understand Bex may mistake her enthusiasm for approval. A two-sentence persona intro — shown once, dismissable — would reduce the "Bex confusion" risk significantly.
**Business value:** Medium. Reduces the gap between "tried it" and "got value from it." Improves activation quality.
**Engineering effort:** S (2–3 hours). A dismissable overlay when chat phase starts, first time only (localStorage flag). Shows persona name, archetype, and what to expect from this conversation.
**Risk:** None.
**Priority: SOON.**

---

### 8. Shareable Punch List Link

**Customer value:** High. The most observed user behavior was: complete session → download PDF → send to team. A shareable link (no login required for the recipient) makes this native to the product instead of a manual workaround. "Here's what The Seat said about our onboarding module" is also an acquisition mechanism — every shared link is a product demo.
**Business value:** Very high. This is the viral loop. One user who shares a punch list with five colleagues is five potential users. The punch list is the most compelling advertisement for the product.
**Engineering effort:** M (3–4 days). Generate a UUID-based shareable URL. Store punch list items with a `share_token` in Supabase. Build a read-only `/share/[token]` page. No auth required for viewing.
**Risk:** Low. Read-only page. Add a CTA: "Want to test your training? Try The Seat."
**Priority: SOON — this is the growth mechanism.**

---

### 9. Rate Limiting (Wire the Existing Table)

**Customer value:** None.
**Business value:** 🔴 Critical before scale. The `rate_limits` table exists and has never been queried. Using Claude Opus with no session cap means a single heavy user on a $29/month plan could cost more in API fees than they paid. This is a financial risk that must be resolved before any paid tier is promoted.
**Engineering effort:** S–M (1 day). Read from `rate_limits` at the start of each AI API call. Increment on completion. Return a 429 with a friendly message when the cap is hit. Cap: 15 sessions/month on paid tier.
**Risk:** Medium. Getting the cap wrong (too low) causes frustration. Getting it wrong (too high) costs money. Start at 15 and adjust.
**Priority: SOON — must be done before Stripe is promoted publicly.**

---

### 10. Team Sharing / Multi-Seat Access

**Customer value:** Very high. The observed use case (Analytics Leader downloads PDF and sends to team) is a team use case. Making it native — one team admin, multiple users under one account, shared session history — unlocks the collaborative dynamic that is already happening informally.
**Business value:** Very high. Team pricing is where the real revenue lives. A team of 5 at $99/month is 5x the individual revenue with 1x the sales effort. Leader buyers have budget. Individual designers often don't.
**Engineering effort:** XL (2–3 weeks). Requires: team/org table, team membership, admin role, billing at team level, shared session visibility. Not trivial.
**Risk:** High. Building team features before validating demand is a classic startup mistake. Do user interviews first.
**Priority: LATER — validate demand through conversations before building.**

---

## What Should Be Built Immediately (Next 2 Weeks)

In strict priority order:

1. PostHog analytics + 5 events (Day 1)
2. Tally feedback form linked from punch list (Day 1)
3. Session persistence in localStorage (Day 2)
4. Fix "My Sessions" — build minimal session history page (Days 3–5)
5. Turn on Stripe for new users (Day 7)
6. Direct outreach to 5 beta users for 20-minute calls (ongoing)

**Total engineering time: ~6–8 days. Total cost: $0.**

---

## What Should Wait

- **Email follow-up sequence** — wait until you have email capture and at least 20 activated users. Sending to 5 people is a conversation, not automation.
- **Onboarding overlay** — wait until analytics shows where drop-off is. Might not be at the persona explainer.
- **Shareable punch list** — wait until retention data shows users want to come back. Build the sharing loop only after the core loop is validated.
- **Rate limiting** — wait until Stripe is live, then do it immediately.
- **Team features** — wait until 3 user interviews confirm the team use case and at least one user says "I'd pay more for team access."
- **More personas** — see below. Legitimate and important, but needs a design brief from real users first.
- **Certification / badge** — "This training passed The Seat" has real potential in L&D circles. Revisit in 6 months when you have enough completed sessions to define what passing means and who would display it.
- **Articulate/Rise integration** — useful retention play, but not until you have 500 users who regularly use those tools. Build integrations for the workflow tools your users are already in, not the ones you assume they use.
- **Mobile app** — build it when mobile sessions are a meaningful share of traffic and users are complaining about the web experience. Not today.

---

## What Should Probably Never Be Built

**An AI-powered training builder.** "What if The Seat could also help you build the training?" is a different product, a different market, and a different company. The Seat's power comes from being a feedback tool, not a creation tool. Mixing them risks losing the identity entirely. If this ever gets built, it should be a separate product.

**A community platform.** Julie is the community. Forums, Slack groups, and Discord servers require maintenance, moderation, and critical mass that doesn't yet exist. Build community through Julie's content and voice. If a community emerges organically, give it a home. Don't build the home first and hope community shows up.

---

## On More Personas (A Longer Note)

More personas is **not** on the never-build list. It is the right direction. The argument against building them *right now* is about timing and quality, not direction.

**Why not yet:**
Dana, Marcus, and Bex are not just system prompts — they're fully calibrated characters with specific opening moves, progression arcs, and coaching modes. A rushed fourth persona that produces generic feedback would hurt the product more than having three great ones. And we don't yet know which of the three existing personas produces the most value, which would inform what archetype comes next.

**When to build them:**
After 10 customer interviews. Let users tell you who is missing from the room. "I need someone who represents the person who sits in training but is secretly going to share everything with HR." "I need the executive sponsor who only cares about business impact." "I need the complete beginner who is genuinely lost." Those are design briefs. That's when you build the next one.

**What the expansion looks like:**
- New archetypes unlocked by industry or use case (compliance training, sales enablement, leadership development each have distinct learner types)
- Custom persona builder for enterprise customers ("describe your audience, we'll generate a persona")
- Named personas submitted by the community and validated by Julie

The persona system is the core IP of The Seat. Expanding it thoughtfully is one of the most valuable things the product can do. The trigger is: user research has told us exactly who needs to be in the room next.

---

## 90-Day Milestones

| Milestone | Target Date | What It Proves |
|---|---|---|
| Analytics installed | Week 1 | We can see what's happening |
| First paying user | Week 3 | People will pay |
| 5 user interviews completed | Week 3 | We know why they use it |
| Session history page live | Week 2 | Returning users have a reason to come back |
| Day-7 return rate >20% | Day 30 | The product creates repeating behavior |
| $500 MRR | Day 45 | Revenue is real |
| Shareable punch list live | Day 45 | The viral loop is open |
| Team pricing conversations | Day 60 | The enterprise path is validated or ruled out |
| $2,000 MRR | Day 90 | PMF trajectory is positive |
