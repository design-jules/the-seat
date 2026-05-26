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
          <img src="/hero2.png" alt="Person sitting in a chair, seen from behind" />
        </div>
        <div className="hero-content">
          <h1 className="display hero-anim-1" style={{ color: 'var(--evergreen)' }}>
            Design from<br />
            <span className="hero-lime-highlight">the seat</span><br />
            that matters.
          </h1>
          <p className="hero-subhead hero-anim-3">
            Your training looks great. But what do your learners think?
            Find out before you&apos;re in the room.
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
              <p className="who-statement">Most people have <span>80% of what they need</span> to design great training. The Seat gets you to 100% of awesome.</p>
              <p className="who-body">The Seat is for the experienced L&amp;D designer looking to uplevel their training, for the person who has never done this before, and everyone in between.</p>
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
