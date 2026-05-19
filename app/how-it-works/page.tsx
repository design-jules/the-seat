import Link from 'next/link';

export default function HowItWorks() {
  return (
    <main>
      {/* Hero */}
      <section className="hiw-hero">
        <div className="hiw-hero-inner">
          <h2 className="display" style={{ color: 'var(--white)', marginBottom: '24px' }}>
            Four steps.<br />One honest conversation.
          </h2>
          <p className="hiw-hero-sub">
            The Seat walks you through a process that mirrors how the best L&amp;D designers actually think. It starts with the learner, not the slide deck.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="hiw-steps-section">
        <div className="hiw-steps-grid">

          <div className="hiw-step">
            <div className="hiw-step-num-wrap"><span className="hiw-step-num">01</span></div>
            <div className="hiw-step-content">
              <h3 className="hiw-step-title">Pick a seat</h3>
              <p className="hiw-step-desc">Choose which learner persona you want to design for. The Skeptic, The Hype, or The Slammed. Each one tells you something different about your training.</p>
            </div>
          </div>

          <div className="hiw-step">
            <div className="hiw-step-num-wrap"><span className="hiw-step-num">02</span></div>
            <div className="hiw-step-content">
              <h3 className="hiw-step-title">Upload your content</h3>
              <p className="hiw-step-desc">Drop in your slides, outline, or session plan. The Seat will read it. No reformatting required.</p>
            </div>
          </div>

          <div className="hiw-step">
            <div className="hiw-step-num-wrap"><span className="hiw-step-num">03</span></div>
            <div className="hiw-step-content">
              <h3 className="hiw-step-title">Get interrogated</h3>
              <p className="hiw-step-desc">Your chosen learner will push back, get bored, check out, or light up. Just like the real thing. Except here, their honesty is a feature.</p>
            </div>
          </div>

          <div className="hiw-step">
            <div className="hiw-step-num-wrap"><span className="hiw-step-num">04</span></div>
            <div className="hiw-step-content">
              <h3 className="hiw-step-title">Get your punch list</h3>
              <p className="hiw-step-desc">Walk away with specific, actionable changes to make your training land. Not vibes. Actual next steps.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Pull quote + principles */}
      <section className="hiw-pullquote-section">
        <p className="hiw-pullquote">If you can&apos;t say what your learner will do differently on Monday, you don&apos;t have a training. You have a meeting.</p>

        <p className="hiw-principles-overline">The Philosophy Behind the Process</p>
        <div className="principles-grid" style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'left' }}>
          <div className="principle-card mist">
            <p className="principle-num">Principle 01</p>
            <h3 className="principle-title">Pick one sticky thing.</h3>
            <p className="principle-body">Not 22. Not a framework, not a model. One thing your learner can actually do differently on Thursday. Design backwards from that.</p>
          </div>
          <div className="principle-card lavender">
            <p className="principle-num">Principle 02</p>
            <h3 className="principle-title">Change behavior, not just minds.</h3>
            <p className="principle-body">A learner can leave inspired and still do nothing differently. The goal is not a great session. It&apos;s a different Monday.</p>
          </div>
          <div className="principle-card amber">
            <p className="principle-num">Principle 03</p>
            <h3 className="principle-title">Tailor from the first moment.</h3>
            <p className="principle-body">The second a learner walks in, they&apos;re already asking &ldquo;is this for me?&rdquo; Your job is to answer that question before they even think to ask it.</p>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="hiw-cta-strip">
        <h3>Ready to find out what your learners are actually thinking?</h3>
        <Link href="/session" className="btn-primary" style={{ fontSize: '16px', padding: '15px 36px' }}>Take a Seat</Link>
      </section>
    </main>
  );
}
