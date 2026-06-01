import Link from 'next/link';
import Ticker from '@/components/Ticker';
import Reveal from '@/components/Reveal';
import PersonaCycler from '@/components/PersonaCycler';

export default function Home() {
  return (
    <main>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-image hero-image-anim">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero3.png" alt="Person sitting in a chair" style={{ mixBlendMode: 'multiply' }} />
        </div>
        <div className="hero-content">
          <h1 className="display hero-anim-1" style={{ color: '#ffffff' }}>
            Design from<br />
            <span className="hero-lime-highlight">the seat</span><br />
            that matters.
          </h1>
          <p className="hero-subhead hero-anim-3">
            Pressure-test your training through real learner perspectives
            before you go live. No more guessing.
          </p>
          <div className="hero-buttons hero-anim-4">
            <Link href="/session" className="btn-primary">Take a seat</Link>
            <Link href="/how-it-works" className="btn-outline">See how it works</Link>
          </div>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────── */}
      <Ticker />

      {/* ── WHO THIS IS FOR ──────────────────────────────────── */}
      <section className="section who-section who-angled">
        <div className="section-inner">
          <Reveal>
            <div className="who-grid">
              <p className="who-statement">Great training isn&apos;t just about what you know. <span>It&apos;s about seeing it the way your learners do.</span></p>
              <p className="who-body">You&apos;ve got the knowledge. You&apos;ve done the work. What you&apos;ve been missing is the view from the back of the room — before it matters. The Seat gives you that view.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── MEET YOUR LEARNERS ───────────────────────────────── */}
      <section className="section meet-section">
        <div className="section-inner">
          <Reveal>
            <h2 className="meet-headline">Three seats. Three honest perspectives.</h2>
            <p className="meet-subhead">Most training is designed from the front of the room. The Seat puts you in the back — in the chair of the person you most need to reach. Find out what&apos;s <em>actually landing</em> before you ever walk in.</p>
          </Reveal>
        </div>
      </section>

      {/* ── PERSONA CYCLER ───────────────────────────────────── */}
      <Reveal>
        <PersonaCycler />
      </Reveal>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="section testimonials-section">
        <div className="section-inner">
          <Reveal>
            <p className="eyebrow eyebrow-center">What people are saying</p>
            <h2 className="display display-center" style={{ marginBottom: '48px' }}>Real feedback on real training.</h2>
            <div className="testimonials-grid">

              <div className="testimonial-card">
                <p className="testimonial-quote">&ldquo;I walked into my review with way more confidence. Dana asked exactly the question my VP ended up asking — and I already had the answer.&rdquo;</p>
                <div className="testimonial-author">
                  <span className="testimonial-name">— L&amp;D Designer</span>
                  <span className="testimonial-role">Financial Services</span>
                </div>
              </div>

              <div className="testimonial-card">
                <p className="testimonial-quote">&ldquo;I sent it to my whole team before our next review cycle. We caught three things that would have been embarrassing in the room.&rdquo;</p>
                <div className="testimonial-author">
                  <span className="testimonial-name">— Head of Learning</span>
                  <span className="testimonial-role">Tech Company</span>
                </div>
              </div>

              <div className="testimonial-card">
                <p className="testimonial-quote">&ldquo;Marcus made me realise my entire module had no clear takeaway. I thought it was obvious. It wasn&apos;t.&rdquo;</p>
                <div className="testimonial-author">
                  <span className="testimonial-name">— Instructional Designer</span>
                  <span className="testimonial-role">Healthcare</span>
                </div>
              </div>

            </div>
          </Reveal>
        </div>
      </section>

    </main>
  );
}
