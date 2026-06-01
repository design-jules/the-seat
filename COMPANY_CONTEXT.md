# Company Context — The Seat

*Last updated: June 2026. Written for internal strategic use.*

---

## What We Are

The Seat is a pre-review pressure-testing tool for L&D designers and the leaders who commission their work. You upload a training deck or script, and three AI personas — each representing a real learner archetype — read it and respond in character. You have a live conversation with each one, then receive a prioritized punch list of changes to make before anyone else sees the work.

The core insight: **most training problems are discoverable before review. They just need a way to be surfaced.** Review meetings waste time because obvious gaps get flagged there instead of two weeks earlier at someone's desk.

The Seat is that two-weeks-earlier moment.

---

## The Problem We Solve

**For L&D designers:**
Training review meetings are frequently demoralizing. Designers walk in having done their best work and leave with a list of changes that feel arbitrary, political, or like they should have been obvious. The emotional cost is real — and so is the rework time.

The root cause: designers have no way to pressure-test their work from the learner's point of view before it gets reviewed by stakeholders. They design from the front of the room. The Seat puts them in the back.

**For L&D leaders:**
Review cycles are expensive. Multiple stakeholders, multiple rounds, multiple iterations — often on the same avoidable problems. Leaders want their teams to ship better work faster, but they don't have a scalable way to raise the quality bar before content reaches them.

The Seat gives leaders a tool to send upstream: *run this before you share*.

---

## The Three Personas

These are the core IP of the product. Each is carefully calibrated — not a caricature, but a real type of person who shows up in training rooms.

**Dana — The Skeptic**
Experienced. Dry. Not hostile, just withholding. Won over gradually by specificity and real examples, never by enthusiasm or polish. Starts at a 5, not a 9. When something genuinely lands, the lean-in feels earned. This is the voice in the room that every designer fears and every leader respects.

**Marcus — The Slammed**
14 Slack messages waiting. Meeting in 20 minutes. Here because his manager said so. Not unkind, just stretched thin. Needs one clear, actionable takeaway or he checks out. When training is genuinely well-structured, he notices and says so. His feedback cuts straight to utility.

**Bex — The Hype**
Loves training. Takes notes on everything. Leaves inspired. Does nothing differently three days later. Not aware of this pattern. Enthusiastic feedback from Bex is a trap: if she's the only one who loved it, the training probably didn't work.

The personas are powered by Claude (claude-opus-4-5). System prompts are detailed, character-consistent, and instructed to reference actual content from the training — not speak generically.

---

## Product Architecture (Brief)

Single Next.js 14 App Router application. The entire product experience lives in one route: `/session`. It is a client-side state machine with five phases: upload → scanning → results → chat → punchlist.

**Key technical decisions:**
- All file extraction is client-side (pdfjs-dist + mammoth) — no file upload to the server. Only extracted text hits the API. This was a deliberate workaround for Vercel's 4.5MB serverless limit and means there is no practical file size ceiling.
- All AI calls use Claude Opus (most capable, most expensive). No prompt caching, no model tiering.
- No session persistence. All state lives in React state. Browser refresh = start over.
- Supabase for auth and data. RLS enabled on all tables. No middleware for session refresh — a known gap.

**External dependencies:**
- Anthropic API (Claude) — core product functionality
- Supabase — auth, database
- Vercel — hosting
- Stripe — payments (wired, not activated)
- FormSubmit.co — beta request email notifications (unbranded, unreliable at scale)

---

## Business Model

**Current state:** Pre-revenue. Beta access is code-gated. `TAKEASEAT` works for anyone. Roughly a dozen beta codes distributed manually.

**Intended model:** $19 per session (Stripe is fully wired, price set in env var). The `/access` page shows this price explicitly. This number has not been validated with users.

**Model options on the table (not yet decided):**
- Per-session ($19/session) — low friction, low commitment, hard to build a business on
- Monthly subscription (~$29–49/month) — recurring revenue, better for retention, requires enough use cases to justify
- Annual team seat — org-level purchase, L&D team licenses, natural given the collaborative behavior already observed
- Enterprise / white-label — embedded into LMS or consultancy toolkit
- Freemium — one free session, then paid — lowers barrier, but risks training the market to expect free

**Cost structure to understand before pricing:**
- Claude Opus is the most expensive model in Anthropic's lineup. Each full session (quick scan + 4–8 chat exchanges + punch list) could cost $0.15–$0.60+ in API calls depending on content length. At $19/session with ~3% margin after API costs, this model is thin.
- No other meaningful costs at current scale (Vercel free tier, Supabase free tier).

---

## Current Users

Small, hand-selected beta cohort. No public launch. Distribution has been personal/network.

**What we know from the first wave:**
- Users are L&D designers and L&D leaders (both sides of the table)
- The use case hits instantly — no long explanation needed
- At least one user immediately sent results to their team for action
- Users are using the PDF export (built this week) — the sharing behavior was happening before we made it easy
- The "review meeting" framing resonates across seniority levels

**What we don't know:**
- How many people have actually completed a full session
- Whether they come back for a second session
- What types of training content work best (slides, scripts, outlines?)
- Which persona is most valuable to them
- Whether they would pay $19, and if so, for what unit

---

## Competitive Landscape

**Direct competitors:** None known. This specific problem (pre-review learner perspective simulation) has no direct product equivalent.

**Adjacent tools:**
- AI writing assistants (ChatGPT, Claude, Gemini) — general purpose, no L&D persona specificity, no structured output
- Survey/feedback tools (SurveyMonkey, etc.) — require actual human respondents, async, not conversational
- LMS review workflows — reviewer comments on finished content, not a pressure-test before sharing
- L&D consultants — expensive, slow, human — The Seat is the async, instant version

**The moat:** The personas. The specificity of Dana, Marcus, and Bex is what makes this feel like a real interaction rather than a generic AI critique. That specificity took craft to build and will take iteration to deepen. It is not easily replicated by prompting ChatGPT generically.

---

## Positioning

**Current tagline:** "Design from the seat that matters."

**What makes it different:**
1. It speaks in a specific voice, not a generic AI voice
2. It surfaces problems conversationally, not as a checklist
3. It ends with an actionable punch list, not a vague critique
4. It represents three different learner perspectives simultaneously

**Who it is NOT for (yet):**
- Instructional designers who are brand new (they need coaching, not pressure-testing)
- Organizations with no established review process (the problem has to exist for the tool to solve it)
- Academic institutions (different review culture, different content types)

---

## Founder

Julie Kirkham — L&D designer, practitioner, and founder. Deep domain expertise. The personas, the voice, the problem framing, and the product instincts all come from Julie's own experience sitting in exactly the kinds of review meetings The Seat is designed to prevent.

This founder-problem fit is an asset. The Seat doesn't feel like a tool built by engineers who read about L&D. It feels like it was built by someone who has lived it.

---

## Where We Are

Beta. Pre-revenue. Proof of concept is validated — real users, real reactions, real sharing behavior. The product works. The question now is: does it work well enough, for enough people, that they'll pay for it repeatedly?

That's the question the next 90 days need to answer.
