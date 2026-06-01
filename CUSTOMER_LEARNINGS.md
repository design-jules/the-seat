# Customer Learnings — The Seat

*A living document. Update after every user conversation, session observation, or piece of feedback.*

---

## What We Know (Confirmed)

### The sharing behavior is already happening
One beta user downloaded the PDF and immediately sent it to their team: *"I literally downloaded all of the PDFs and sent them to my team and said go fix these things."* This happened before we built a combined PDF export — they were doing it manually. This is the most important data point we have. The Seat is not just a personal reflection tool. It is already functioning as a **team quality gate**.

### The pain point is real and immediate
No user has needed a long explanation of what The Seat does or why it matters. The framing — "what would Dana say about this before your review meeting?" — lands without prompting. This suggests the problem is well-understood and felt acutely by the target audience.

### Both sides of the table feel it
We have quotes from both L&D designers (who make the training) and L&D leaders (who commission and review it). This is significant. The problem is bilateral — designers dread the review; leaders dread sitting through avoidable conversations. The Seat speaks to both, which means the purchase rationale can come from either direction.

### The punch list format is the right output
*"It's so nice to have the main points surfaced without wondering what someone is trying to tell me for feedback."* This quote tells us something important: users are not just getting value from the conversation — they're getting value from the structured, prioritized output. Vague AI critique is noise. Prioritized, titled action items are actionable. The format matters as much as the content.

### Enthusiasm converts to action (at least for one user)
*"I'm going to run every piece of content through this!"* — this is the signal we want for a usage-based or subscription model. If users see The Seat as part of their standard pre-review workflow, not a one-time experiment, the retention math works. We have one user saying this out loud. We need to know if that's true at 30, 60, 90 days.

---

## What We Infer (Strong Signal, Not Confirmed)

### The unit of value might be the team, not the individual
The first user's behavior (download → send to team → "go fix these things") suggests the primary beneficiary of a session is actually the team, not just the person who ran it. If that's true, pricing per individual session undervalues the product. A team/seat model where one person runs sessions and shares results with 3–5 colleagues is a different (and higher-value) pricing frame.

### L&D leaders are buyers, not just users
The quotes from L&D Leaders suggest they are experiencing the product, not just hearing about it. If leaders are running sessions themselves — or at minimum reading the results — they are a viable purchase decision-maker. Leaders have budget. Designers often do not. Selling to leaders changes the deal size.

### Enterprise training is a primary use case
*"I uploaded a script that we're working on for enterprise training."* Enterprise L&D programs are high-stakes, multi-stakeholder, and expensive to revise post-launch. The Seat's value proposition — catch problems before review — is worth significantly more in this context than for a quick internal lunch-and-learn. Enterprise content likely produces longer, richer sessions with more at stake. This may be where the product is most valuable and where pricing power exists.

### The review meeting is the shared emotional anchor
Every piece of messaging that lands seems to reference the review meeting. "Before anyone took a seat." "Before you share." "Wondering what someone is trying to tell me for feedback." Users are not primarily motivated by improving training quality in the abstract — they are motivated by a specific, emotionally charged moment: the review room. That is the pain. Design everything around that.

### People self-select based on existing quality awareness
Early users are people who already care about training quality and already feel the gap. They are not random L&D practitioners — they are the ones who worry about reviews, who want feedback before sharing, who are invested enough to seek out a tool like this. This means early adoption will be fast among quality-conscious practitioners and slow among anyone who doesn't yet feel the problem.

---

## What We Don't Know (Critical Gaps)

### Do users come back?
We have no retention data. Zero. We don't know if the user who said "I'm going to run every piece of content through this" has run a second session. This is the single most important question for the business model. If users run one session, feel great, and never return, we have a one-time tool. If they run sessions regularly, we have a workflow product.

**How to find out:** Session history in Supabase + a simple "last session" check + a follow-up email at Day 3, Day 7, Day 30.

### Will they pay, and for what unit?
$19 per session is a guess. We have not asked anyone. We don't know if the resistance is to payment at all, to the per-session model, or to the price point. We also don't know if an annual subscription (~$199–299/year) would be an easier sell than $19 per use.

**How to find out:** Turn on Stripe for new non-beta users and watch. Also: ask the 3 users who gave testimonials directly.

### Which persona creates the most value?
We don't know if Dana, Marcus, or Bex produces the most useful feedback for most users. If one persona consistently produces the best punch lists, that's both a product insight (double down) and a marketing insight (lead with that persona's use case).

**How to find out:** Analytics on which persona is selected first, which generates the longest conversations, which produces punch lists users act on.

### What types of training content work best?
We know one user uploaded an enterprise training script. We don't know how the personas handle short outlines vs. full decks vs. video scripts vs. compliance training. Some content types may produce terrible results (too short, too dense, wrong format) and we'd have no idea.

**How to find out:** Ask users what they uploaded. Look at session content length in the DB. Add a content type field to the session form.

### Where do people drop off?
We don't know if users are completing sessions or abandoning them mid-way. If most people upload, see the scan results, select a persona, have two exchanges, and leave — the punch list (our highest-value output) is not being seen. This would fundamentally change what we optimize for.

**How to find out:** Add analytics (PostHog, Mixpanel, or even just custom events to Supabase) tracking phase transitions.

### Are leaders buying for their teams or using it themselves?
The L&D Leader quote could mean: (a) a leader used the tool themselves to review their team's work, or (b) a leader sent the tool to a designer and the designer ran the session. These are very different buying motions. One is a personal tool for leaders; the other is a quality gate that leaders mandate for designers.

**How to find out:** Ask the two L&D Leaders who gave quotes how they actually used it.

### Is the "Before You Take a Seat" checklist driving inbound?
We just launched the free resource. We don't know if anyone has downloaded it, shared it, or come back to use the tool after finding the checklist first. This is a potential content marketing flywheel with zero data attached.

**How to find out:** Add UTM tracking to the download link + a simple thank-you page with a CTA back to `/session`.

---

## User Segments (Hypothesis)

We have enough signal to name four distinct segments. We don't yet know which is the primary buyer.

### 1. The Quality-Obsessed Designer
*Profile:* Senior L&D designer, individual contributor. Has been in bad review meetings. Cares deeply about craft. Already doing some form of self-review before sharing.
*Pain:* No external perspective before review. Vulnerable to blind spots.
*Value prop:* "Find out what Dana will say before your VP does."
*Likelihood to pay:* High, if they use regularly. Budget may be personal.

### 2. The Standard-Setting Leader
*Profile:* Head of L&D, VP of Talent. Manages a team of designers. Review meetings are a cost center.
*Pain:* Team's work quality is inconsistent. Review cycles are long.
*Value prop:* "Send this to your team before every review. Stop having the same conversations."
*Likelihood to pay:* Very high. Has budget. Team-level purchase.

### 3. The Collaborative Team
*Profile:* L&D team of 3–8 people. Mix of designers and leads. Already sharing work before formal review.
*Pain:* Informal peer review is inconsistent. No structured feedback format.
*Value prop:* "One session produces a PDF the whole team can act on."
*Likelihood to pay:* High, with team pricing. Per-person pricing would be a barrier.

### 4. The One-Time Experimenter
*Profile:* Someone who heard about The Seat, tried it once for a specific project, got value, and moved on.
*Pain:* Specific high-stakes training in progress.
*Value prop:* Risk reduction for one important project.
*Likelihood to pay:* Low on subscription. Would pay per-session for a high-stakes moment.

---

## Conversations We Need to Have

Immediately — before building anything else:

1. **Call the Analytics Leader (Media & Entertainment).** Find out: what did they upload, how long did it take, what was the most useful persona, did they use the results, would they pay, do they work in a team that would benefit from regular access?

2. **Call both L&D Leaders (Healthcare and Ad Tech).** Find out: were they using it themselves or reviewing a designer's work? Would they buy licenses for their team? What price would make sense?

3. **Ask every beta user the same five questions:**
   - What did you upload?
   - Which persona was most useful?
   - Did you make any changes to your training based on the output?
   - Have you come back for a second session?
   - Would you pay $X/month for unlimited sessions?

---

## Messaging That Is Working

- *"Design from the seat that matters."* — landing
- *"Before anyone took a seat"* — landing
- *"Go fix these things"* — user-generated, steal it
- The review meeting framing — consistently resonates
- The three-persona structure — immediately understood

## Messaging to Test

- Team/collaborative angle: "One session. A PDF your whole team can act on."
- Leader angle: "Send this to your team before the next review cycle."
- Risk reduction angle: "Know what the review room will say before you walk in."
- Workflow angle: "Part of how great L&D teams review their work."
