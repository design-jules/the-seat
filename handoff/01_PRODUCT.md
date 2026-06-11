# Product — The Seat

---

## What It Is

The Seat is a pre-review pressure-testing tool for L&D designers. You upload a training deck or script. Three AI personas — each a real learner archetype — read it and respond in character. You have a live conversation with each one, then receive a prioritized punch list of what to fix before anyone else sees the work.

**Core insight:** Most training problems are discoverable before review. They just need a way to be surfaced. Review meetings waste time because obvious gaps get flagged there instead of two weeks earlier at someone's desk. The Seat is that two-weeks-earlier moment.

**Live at:** theseatmethod.com

---

## The Three Personas

These are the core IP. Not caricatures — carefully calibrated real types.

**Dana — The Skeptic**
Experienced. Dry. Not hostile, just withholding. Won over gradually by specificity and real examples, never by enthusiasm or polish. Starts at a 5, not a 9. When something genuinely lands, the lean-in feels earned. This is the voice in the room that every designer fears and every leader respects.

**Marcus — The Slammed**
14 Slack messages waiting. Meeting in 20 minutes. Here because his manager said so. Not unkind, just stretched thin. Needs one clear, actionable takeaway or he checks out. When training is genuinely well-structured, he notices and says so. His feedback cuts straight to utility.

**Bex — The Hype**
Loves training. Takes notes on everything. Leaves inspired. Does nothing differently three days later. Not aware of this pattern. Enthusiastic feedback from Bex is a trap: if she's the only one who loved it, the training probably didn't work.

Personas are powered by Claude (claude-opus-4-5). System prompts are detailed, character-consistent, and instructed to reference actual content from the training — not speak generically.

**Persona colors:**
- Dana: `#023B28` (evergreen)
- Marcus: `#149077` (jungle teal)
- Bex: `#8a3fad` (purple)

---

## The Product Flow

```
1. Upload (or paste) training content
2. Quick scan — Claude generates 3 persona preview snippets
3. User selects a persona
4. Live chat with that persona (conversational, in-character)
5. User clicks "Get my punch list"
6. Prioritized punch list rendered (DO FIRST / DO NEXT / NICE TO HAVE)
7. User can try a second or third persona
8. PDF export of all completed sessions
```

The entire flow lives at `/session`. No page reloads. All state in React.

---

## The Problem

**For L&D designers:** Review meetings are frequently demoralizing. Designers walk in having done their best work and leave with a list of changes that feel arbitrary, political, or like they should have been obvious. The root cause: no way to pressure-test from the learner's POV before stakeholder review. The Seat puts them in the back of the room before the meeting.

**For L&D leaders:** Review cycles are expensive. Multiple stakeholders, multiple rounds, on the same avoidable problems. The Seat gives leaders a tool to send upstream: "run this before you share."

---

## Business Model

**Current state:** Pre-revenue. Beta access is code-gated. `TAKEASEAT` and `SEAT158` are generic codes that work for anyone. Roughly a dozen named beta codes distributed manually.

**Intended model:** $19/session. Stripe is fully wired (price in `STRIPE_PRICE_ID` env var). The `/access` page shows this price. Not yet activated for new users.

**Model options on the table:**
- Per-session ($19) — low friction, low commitment
- Monthly subscription (~$29–49/month) — recurring revenue, better for retention
- Annual team seat — org-level purchase, L&D team licenses
- Enterprise / white-label — embedded in LMS or consultancy toolkit
- Freemium — one free session, then paid

**API cost reality:** Claude Opus costs ~$0.28–0.55/session in API calls. At $19/session, margin is ~98% gross before API costs. At $29/month with 4 sessions, still healthy. Rate limiting must be enforced before any subscription tier goes live.

---

## Current Users

Small, hand-selected beta cohort. No public launch. Distribution has been personal/network.

**What we know:**
- Users are L&D designers and L&D leaders (both sides of the table)
- The use case hits instantly — no long explanation needed
- At least one user immediately sent results to their team for action (downloaded PDFs, sent them with "go fix these things")
- The PDF export gets used heavily
- The "review meeting" framing resonates across seniority levels

---

## Competitive Landscape

**Direct competitors:** None known. Pre-review learner perspective simulation has no direct equivalent.

**Adjacent tools:**
- AI writing assistants (ChatGPT, etc.) — general purpose, no L&D persona specificity, no structured output
- Survey/feedback tools — require actual human respondents, async, not conversational
- LMS review workflows — reviewer comments on finished content, not a pressure-test before sharing
- L&D consultants — expensive, slow, human

**The moat:** The personas. The specificity of Dana, Marcus, and Bex is what makes this feel like a real interaction. That specificity took craft to build and is not easily replicated by prompting a generic AI.

---

## Current Tagline

"Design from the seat that matters."

---

## What It Is NOT For (Yet)

- Brand-new instructional designers (they need coaching, not pressure-testing)
- Organizations with no established review process
- Academic institutions (different review culture)

---

## Founder

Julie Kirkham — L&D designer, practitioner, founder. The personas, the voice, the problem framing, and the product instincts all come from Julie's own experience in exactly the kinds of review meetings The Seat is designed to prevent. This founder-problem fit is the product's greatest asset.
