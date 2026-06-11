# Strategy — The Seat

*Sources: METRICS.md, GTM_FIRST_25.md, CUSTOMER_LEARNINGS.md, June 2026*

---

## North Star Metric

**Repeat sessions per user.** A user who runs one session found it interesting. A user who runs 3+ sessions in a month has changed their workflow. Only the second type sustains a business.

**Target (90 days):** 30% of activated users run a second session within 14 days.
**Target (6 months):** 20% of activated users run 3+ sessions in a month.

---

## What We Know from Beta Users

### The sharing behavior is real and already happening
One beta user: *"I literally downloaded all of the PDFs and sent them to my team and said go fix these things."* This happened before the combined PDF export existed. They were doing it manually.

**Implication:** The Seat is already functioning as a team quality gate, not just a personal reflection tool. The unit of value may be the team, not the individual. This changes the pricing frame.

### The pain point needs no explanation
No user has needed a long explanation of what The Seat does or why it matters. The review meeting framing lands instantly. Everyone in L&D has been in that room.

### Both designers and leaders feel it
Quotes from both L&D designers (who make training) and L&D leaders (who commission and review it). The problem is bilateral. The purchase rationale can come from either direction.

### The punch list format is the right output
*"It's so nice to have the main points surfaced without wondering what someone is trying to tell me for feedback."* The structured, prioritized output matters as much as the content. Vague AI critique is noise. Titled action items are actionable.

---

## What We Don't Know (Critical Gaps)

**Do users come back?** Zero retention data. The single most important question. Follow-up email at Day 3, Day 7, Day 30.

**Will they pay?** $19/session is a guess. Turn on Stripe for new users and watch. Ask the 3 testimonial users directly.

**Which persona creates the most value?** No analytics on selection rates yet. PostHog is installed — data will start flowing.

**Where do people drop off?** No funnel data yet. PostHog will surface this.

**Are leaders buying for teams or using it themselves?** The L&D Leader quote could mean either. Need to ask.

---

## User Segments (Hypothesis)

### 1. The Quality-Obsessed Designer
Senior L&D individual contributor. Has been in bad review meetings. Cares about craft. Already doing informal self-review.
- Pain: No external perspective before review
- Value prop: "Find out what Dana will say before your VP does"
- Likelihood to pay: High if regular use. Budget may be personal.

### 2. The Standard-Setting Leader
Head of L&D, VP Talent. Manages a team of designers. Review meetings are a cost center.
- Pain: Team work quality is inconsistent. Cycles are long.
- Value prop: "Send this to your team before every review. Stop having the same conversations."
- Likelihood to pay: Very high. Has budget. Team-level purchase.

### 3. The Collaborative Team
L&D team of 3–8. Mix of designers and leads. Already sharing work before formal review.
- Pain: Informal peer review is inconsistent. No structured format.
- Value prop: "One session produces a PDF the whole team can act on."
- Likelihood to pay: High with team pricing. Per-person pricing would be a barrier.

### 4. The One-Time Experimenter
Heard about The Seat, tried it once for a specific high-stakes project, got value, moved on.
- Pain: Specific high-stakes training in progress
- Likelihood to pay: Low on subscription. Would pay per-session.

---

## GTM Strategy: Getting the First 25 Meaningful Users

**Meaningful** = completed at least one full session + gave feedback or willing to get on a call.

We need to reach 150–200 people to get 25 meaningful users.

### Outreach Principles

- Quality over quantity. 25 thoughtful DMs beat 500 blasted ones.
- Reference something specific about the person. Name the problem. Ask for 20 minutes, not a demo.
- Don't explain the product in the first message. Don't send a Calendly link first.

**DM template:**
> Hi [name] — I saw your post about [L&D topic]. It landed.
>
> I've been building something for exactly the problem you're describing: that moment in a review meeting when someone flags something you could have caught three weeks ago. I'd love to get your reaction to it. Not a sales call, just a founder trying to learn.
>
> Would 20 minutes make sense this week?

### Priority Channels

| Channel | Why |
|---|---|
| LinkedIn DMs | L&D practitioners live here. They post about their frustrations constantly. |
| r/instructionaldesign | 80k+ members. Authentic, skeptical. Don't pitch — answer questions and mention The Seat when genuinely relevant. |
| L&D Shakers (Slack) | Active community. Ask to share a beta post. |
| ATD chapters | Virtual demo slots. Pitch: "What I Learned from Having 3 AI Learners Review My Training." |
| Articulate Community | 1M+ users. Exactly the right people. |

### LinkedIn Content (3 posts/week for 6 weeks)

**Type 1: The Honest Problem Post** — Share a real bad review meeting story. No product pitch. Get IDs nodding. Mention The Seat in comments, not the post.

**Type 2: The Insight Post** — Something useful from The Seat's perspective. "What Dana is waiting for before she leans in." No pitch, just value.

**Type 3: The Artifact Post** — Share a real anonymized punch list. Let the output speak for itself.

**Type 4: The Customer Story** — One testimonial quote at a time, spaced out.

**Type 5: The Direct Ask** — Every few weeks: "I'm looking for 5 L&D designers to pressure-test something. 20 minutes. Free access for honest feedback."

### Founder-Led Tactics

- **The "Live Seat" Demo** — 30-minute Zoom, volunteer's real content, run live. Record and share the clip.
- **The "Before Your Review" Email** — Find 10 people in Julie's network with a review coming up. Email directly.
- **The LinkedIn Comment-to-DM Funnel** — Find posts where L&D folks vent about reviews. Comment substantively. If they engage, follow up in DM.

---

## Customer Interview Plan

Before the 25th user is activated, complete 10 interviews.

**Who:** 3 testimonial-givers (priority), 3–5 activated users, 2–3 who signed up but didn't activate, 2–3 L&D leaders who haven't tried it.

**7 Questions (ask in order):**
1. Tell me about the last training review that didn't go the way you hoped.
2. What did you upload to The Seat? What were you hoping to learn?
3. Walk me through the session. What surprised you?
4. What was the most useful part?
5. What confused you or almost made you stop?
6. Did you do anything differently after the session?
7. If The Seat cost $X/month, would you pay for it? What about $Y?

**After each call:** Write 3 sentences on the most important thing you learned. Update CUSTOMER_LEARNINGS.md within 24 hours. Look for patterns that appear in 3+ interviews.

---

## Funnel (What to Track in PostHog)

```
Visit /session
    ↓ upload_started
    ↓ file_uploaded
    ↓ scan_started
    ↓ scan_completed
    ↓ persona_selected (+ which persona)
    ↓ gate_shown
    ↓ code_entered / code_success / code_fail
    ↓ chat_started
    ↓ message_sent (track count)
    ↓ punchlist_started
    ↓ punchlist_completed
    ↓ pdf_downloaded (+ how many personas completed)
    ↓ second_persona_started
    ↓ session_complete (all 3 personas)
```

**Key ratios:**
| Step | Healthy | Concerning |
|---|---|---|
| Upload started → Scan started | >80% | <60% |
| Scan completed → Persona selected | >70% | <50% |
| Persona selected → Chat started | >85% | <65% |
| Chat started → Punchlist completed | >60% | <40% |
| Punchlist completed → PDF downloaded | >40% | <20% |
| Punchlist completed → Second persona | >30% | <15% |

---

## Revenue Targets

| Milestone | Target |
|---|---|
| Stripe activation | End of June 2026 |
| First paying customer | End of July 2026 |
| $1,000 MRR | End of August 2026 |
| $5,000 MRR | End of Q4 2026 |

---

## API Cost Reality

Using Claude Opus for all AI calls. Cost per full session: ~$0.28–0.55.

- At $19/session: ~98% gross margin. Healthy.
- At $29/month (4 sessions): ~$21 margin. Healthy.
- At $29/month (10 sessions): ~$24.50 margin. Strong.
- At $29/month (50 sessions, NO rate limit): $1.50 margin. Business-breaking.

**Rate limiting must be enforced before any paid tier is promoted.** The table exists in the DB (`rate_limits`). It's just not wired. Recommended cap: 15 sessions/month on base tier.

---

## Messaging That Works

- "Design from the seat that matters." (tagline, landing)
- "Before anyone took a seat" (landing)
- "Go fix these things" (user-generated, steal it)
- The review meeting framing (consistently resonates)
- The three-persona structure (immediately understood)

## Messaging to Test

- "One session. A PDF your whole team can act on."
- "Send this to your team before the next review cycle."
- "Know what the review room will say before you walk in."
- "Part of how great L&D teams review their work."

---

## PMF Checklist

We'll know we have product-market fit when:
1. >40% of users run 3+ sessions in their first month
2. Users are telling colleagues without being asked
3. People are asking to pay before we've asked them to
4. Users report changing training content based on punch list output
5. Users describe The Seat as "part of how we do reviews" not "a tool I tried"
