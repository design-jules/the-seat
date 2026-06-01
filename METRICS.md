# Metrics — The Seat

*What we measure, what we need to measure, and what the numbers need to say for us to have a business.*

---

## Current State: Flying Blind

We are tracking nothing. There is no analytics tool installed. There are no custom events. We have Supabase session records (when a session is saved and when punch list items are generated) but no funnel data, no conversion data, no retention data, and no revenue.

This is the single most urgent operational gap in the business. Every product decision we make right now is based on instinct and three testimonials. That will not survive contact with a real customer base.

**First action:** Install analytics this week. PostHog (free tier, self-hostable, great for product analytics) or Mixpanel. This is a 2-hour task that will change every conversation we have for the next 90 days.

---

## The Metrics That Matter

### North Star: Repeat Sessions Per User

**Why this is the north star:** A user who runs one session and never returns is someone who found the tool interesting. A user who runs three or more sessions in a month is someone who has changed their workflow. Only the second type of user represents a sustainable business — whether that's subscription, per-seat, or enterprise. Everything else is noise until we know this number.

**Target (90 days):** 30% of activated users run a second session within 14 days.

**Target (6 months):** 20% of activated users run 3+ sessions in a month.

---

## Funnel Metrics (Need to Instrument)

Track each of these as named events in analytics:

```
Visit /session
    ↓
UPLOAD_STARTED         — user interacts with upload area or paste tab
    ↓
FILE_UPLOADED          — file successfully extracted
    ↓
SCAN_STARTED           — "See what they think" clicked
    ↓
SCAN_COMPLETED         — results phase rendered
    ↓
PERSONA_SELECTED       — user clicks a persona card (+ which persona)
    ↓
GATE_SHOWN             — access gate modal appeared (and why: no session, no approval)
    ↓
CODE_ENTERED           — user typed a code
    ↓
CODE_SUCCESS / FAIL    — validation result
    ↓
CHAT_STARTED           — chat phase rendered
    ↓
MESSAGE_SENT           — user sends a message (track count)
    ↓
PUNCHLIST_STARTED      — "Get my punch list" clicked
    ↓
PUNCHLIST_COMPLETED    — items returned and rendered
    ↓
PDF_DOWNLOADED         — download button clicked (+ how many personas completed)
    ↓
SECOND_PERSONA_STARTED — user clicks "Try a different seat"
    ↓
SESSION_COMPLETE       — user has done all 3 personas (aspirational)
```

**Key ratios to watch:**

| Funnel step | Healthy | Concerning |
|---|---|---|
| Upload started → Scan started | >80% | <60% |
| Scan completed → Persona selected | >70% | <50% |
| Persona selected → Chat started | >85% | <65% |
| Chat started → Punchlist completed | >60% | <40% |
| Punchlist completed → PDF downloaded | >40% | <20% |
| Punchlist completed → Second persona | >30% | <15% |

---

## Activation Metric

**Definition:** A user is "activated" when they complete at least one full session (upload → scan → chat → punchlist).

This is the moment value is delivered. Everything before it is onboarding. Everything after it is retention.

**Track:** Time to activation from first visit. Target: under 10 minutes.

---

## Retention Metrics

| Metric | What it tells us |
|---|---|
| Day 1 return rate | Did the session create enough value to come back immediately? |
| Day 7 return rate | Is The Seat becoming part of their pre-review habit? |
| Day 30 return rate | Is it a workflow tool or a curiosity? |
| Sessions per user per month | Intensity of use |
| Time between sessions | Tied to review cadence (weekly? monthly?) |

**Target at 90 days:** Day 7 return rate >25%.

---

## Revenue Metrics (When Stripe Is Activated)

| Metric | Definition |
|---|---|
| MRR | Monthly Recurring Revenue (once subscription is live) |
| ARR | Annualized |
| Conversion rate | % of activated users who pay |
| CAC | Cost to acquire a paying customer (currently: $0, Julie's network) |
| LTV | Lifetime value per customer |
| LTV:CAC | Target >3:1 |
| Churn | % of paying users who cancel per month |
| Expansion revenue | When team/org pricing lands |

**Pre-revenue targets to set now:**
- Stripe activation date: target end of June 2026
- First paying customer: target end of July 2026
- $1,000 MRR: target end of August 2026
- $5,000 MRR: target end of Q4 2026

---

## Content + Growth Metrics

| Metric | What it tells us |
|---|---|
| Resources page visits | Is the checklist driving inbound? |
| PDF downloads (Before You Take a Seat) | Top of funnel conversion |
| Download → /session conversion | Content marketing ROI |
| Testimonials shared (social/Slack) | Organic word of mouth |
| Referral sessions (if we add codes) | Viral coefficient |

The "Before You Take a Seat" checklist is an untracked asset right now. Add UTM parameters to the download link and set up a redirect from the download to a "thanks, want to try the tool?" page. This is the cheapest growth lever we have.

---

## API Cost Metrics (Critical Before Scale)

We are using Claude Opus for every AI call. Opus is the most capable — and most expensive — model Anthropic offers.

**Estimated cost per full session:**
- Quick scan (3 personas, ~1000 tokens output): ~$0.045
- Chat (4 exchanges × 600 tokens, plus context grows): ~$0.15–0.30
- Punch list (~1200 tokens output, full conversation as input): ~$0.08–0.15
- **Total per session: ~$0.28–0.55**

At $19/session: ~98% gross margin before API costs → ~$18.45–18.72 margin. Healthy.
At $29/month (4 sessions/month): ~$7.88 API cost → ~$21.12 margin. Still healthy.
At $29/month (10 sessions/month): ~$4.50 API cost → $24.50 margin. Strong.

**But:** With no rate limiting enforced and no session cap, a heavy user could run 50 sessions/month at $29. Cost: ~$27.50. Margin: $1.50. That breaks the business.

**Action required before any paid tier goes live:** Implement rate limiting (the table exists in the DB, it's just not wired). Set a reasonable session cap (10/month on base tier, unlimited on team tier).

---

## Product Health Metrics

These are not vanity metrics — they are early warning indicators:

| Metric | Signal |
|---|---|
| Persona distribution (Dana/Marcus/Bex selection %) | Which persona is most valuable? Are some underused? |
| Average exchange count before punch list | Is the conversation long enough to be useful? |
| Confidence delta (after - before) | Is the tool actually changing how designers feel about their work? |
| Error rate on extract / scan / chat / punch list | Reliability of the product |
| Session abandonment by phase | Where are we losing people? |
| Mobile vs. desktop usage | Does mobile UX need more investment? |

The confidence delta is especially interesting. We're capturing before/after confidence scores in the DB but doing nothing with them. If The Seat consistently lowers confidence (users realize their training was worse than they thought) OR raises it (validation + specific improvements), that's a real outcome to measure and market.

---

## What "Product-Market Fit" Looks Like for The Seat

We'll know we have PMF when:

1. **Retention:** >40% of users run 3+ sessions in their first month
2. **Word of mouth:** Users are telling colleagues without being asked (we see this in referral codes, testimonials, or "how did you hear about us?" responses)
3. **Pull:** People are asking to pay before we've asked them to
4. **Behavior change:** Users report changing training content based on punch list output
5. **Workflow integration:** Users describe The Seat as "part of how we do reviews" not "a tool I tried"

We are not there yet. But we have early signal on #2 and glimpses of #4. That's enough to keep going — and enough to start measuring seriously.

---

## Instrumentation Priority List

In order of urgency:

1. **Install PostHog** (free, 1M events/month free tier, easy Next.js integration) — Week 1
2. **Track the 15 funnel events above** — Week 1
3. **Add session recording** (PostHog has this) to watch real sessions — Week 1
4. **Email capture at punch list completion** ("Want a copy of this emailed to you?") — Week 2
5. **UTM tracking on checklist download** — Week 2
6. **Wire rate_limits table** to actual enforcement logic — Week 3
7. **Stripe activation for new users** — Month 2
8. **Track confidence delta reporting** in a simple dashboard — Month 2
9. **Referral code attribution** — Month 3

---

*Update this document every two weeks. If a metric hasn't moved in two weeks, either we're not tracking it or something is wrong.*
