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
            <Link href="/session" className="btn-primary">Take a Seat</Link>
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
              <p className="who-statement">Great training isn&apos;t a content problem. <span>It&apos;s a perspective problem.</span></p>
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

    </main>
  );
}
