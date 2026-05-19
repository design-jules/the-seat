import Link from 'next/link';

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="hero-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero2.png" alt="Person sitting in a chair, seen from behind" />
        </div>
        <div className="hero-content">
          <p className="eyebrow eyebrow-on-dark">The Seat Method</p>
          <h1 className="display" style={{ color: 'var(--jungle)' }}>
            Design from<br /><span style={{ color: 'var(--white)' }}>the seat</span> that<br />matters.
          </h1>
          <p className="hero-subhead">
            Your training looks great. But what do your learners think?
            Find out before you&apos;re in the room.
          </p>
          <div className="hero-buttons">
            <Link href="/session" className="btn-primary">Take a Seat</Link>
            <Link href="/how-it-works" className="btn-outline">See how it works</Link>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="section who-section">
        <div className="section-inner">
          <div className="who-grid">
            <p className="who-statement">Most people have <span>80% of what they need</span> to design great training. The Seat gets you to 100% of awesome.</p>
            <p className="who-body">The Seat is for the experienced L&amp;D designer looking to uplevel their training, for the person who has never done this before, and everyone in between.</p>
          </div>
        </div>
      </section>

      {/* Meet Your Learners */}
      <section className="section meet-section">
        <div className="section-inner">
          <h2 className="meet-headline">Three seats. Three honest perspectives.</h2>
          <p className="meet-subhead">Most training is designed from the front of the room. The Seat puts you in the back — in the chair of the person you most need to reach. Upload your training, pick a learner, and find out what&apos;s <em>actually landing</em> before you ever walk in.</p>

          <div className="personas-display-grid">

            <div className="persona-display" style={{ background: '#FBF4EA' }}>
              <div className="persona-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/the_skeptic2.png" alt="The Skeptic" />
              </div>
              <div className="persona-pill" style={{ background: '#2a3d30' }}>
                <span className="persona-pill-name" style={{ color: '#FDFAF7' }}>the skeptic</span>
              </div>
              <p className="persona-quote">&ldquo;Why is this worth my time at all?&rdquo;</p>
            </div>

            <div className="persona-display" style={{ background: '#E2F3F0' }}>
              <div className="persona-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/the_hype2.png" alt="The Hype" />
              </div>
              <div className="persona-pill" style={{ background: '#F5E8F3' }}>
                <span className="persona-pill-name" style={{ color: '#2a3d30' }}>the hype</span>
              </div>
              <p className="persona-quote">&ldquo;Wow that was such a fun class, but no idea what to do now.&rdquo;</p>
            </div>

            <div className="persona-display" style={{ background: '#EBD6E9' }}>
              <div className="persona-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/the_slammed2.png" alt="The Slammed" />
              </div>
              <div className="persona-pill" style={{ background: '#E2F3F0' }}>
                <span className="persona-pill-name" style={{ color: '#2a3d30' }}>the slammed</span>
              </div>
              <p className="persona-quote">&ldquo;I&apos;m too busy to be here.&rdquo;</p>
            </div>

          </div>

          <div className="meet-cta">
            <Link href="/session" className="btn-primary" style={{ fontSize: '16px', padding: '15px 36px' }}>Take a Seat</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
