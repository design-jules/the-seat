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
                <p className="testimonial-quote">&ldquo;I uploaded a script that we&apos;re working on for enterprise training and WOW. I literally downloaded all of the PDFs and sent them to my team and said go fix these things!&rdquo;</p>
                <div className="testimonial-author">
                  <span className="testimonial-name">Analytics Leader</span>
                  <span className="testimonial-role">Global Media &amp; Entertainment</span>
                </div>
              </div>

              <div className="testimonial-card">
                <p className="testimonial-quote">&ldquo;It&apos;s so nice to have the main points surfaced without wondering what someone is trying to tell me for feedback.&rdquo;</p>
                <div className="testimonial-author">
                  <span className="testimonial-name">L&amp;D Leader</span>
                  <span className="testimonial-role">Healthcare</span>
                </div>
              </div>

              <div className="testimonial-card">
                <p className="testimonial-quote">&ldquo;This is just what I needed right now! I&apos;m going to run every piece of content through this!&rdquo;</p>
                <div className="testimonial-author">
                  <span className="testimonial-name">L&amp;D Leader</span>
                  <span className="testimonial-role">Ad Tech</span>
                </div>
              </div>

            </div>
          </Reveal>
        </div>
      </section>

    </main>
  );
}
