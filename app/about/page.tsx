import Link from 'next/link';

const CheckIcon = () => (
  <svg viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 5L5 8.5L11.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function About() {
  return (
    <main>
      {/* Section 1: Hero */}
      <section className="about-hero-new">
        <div className="about-hero-grid">

          <div className="about-hero-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/juliek-profile.png" alt="Julie Kirkham" />
          </div>

          <div className="about-hero-copy">
            <p className="about-hero-eyebrow">About the Designer</p>
            <h2 className="about-hero-headline">
              <span className="bold">Hi. I&apos;m Julie.&nbsp;👋</span><br />
              <span className="light">I&apos;m an L&amp;D leader who has spent the past </span><span className="bold">twenty years</span><span className="light"> obsessing over one question: </span><span className="bold">what does the learner actually need?</span>
            </h2>
          </div>

        </div>
      </section>

      {/* Section 2: Quick Facts */}
      <section className="about-facts-section">
        <div className="about-facts-inner">
          <h2 className="about-facts-heading">
            <span className="light">Quick Facts </span><span className="bold">About Julie</span>
          </h2>
          <div className="about-facts-grid">

            <div className="about-fact-item">
              <div className="about-fact-check"><CheckIcon /></div>
              <p className="about-fact-text"><strong>I&apos;ve designed learning for Amazon drivers, Fortune 500 executives, doctors, Target cashiers, engineers, creatives, sales teams, and everything in between.</strong> If they sit in a chair and learn things, I&apos;ve probably designed for them.</p>
            </div>

            <div className="about-fact-item">
              <div className="about-fact-check"><CheckIcon /></div>
              <p className="about-fact-text"><strong>I have ADHD, which means I experience bad training very personally and very immediately.</strong> I used to think it was annoying but I&apos;ve come to love that it&apos;s a superpower that helps me design for the distracted masses.</p>
            </div>

            <div className="about-fact-item">
              <div className="about-fact-check"><CheckIcon /></div>
              <p className="about-fact-text"><strong>Someone on my L&amp;D team once said &ldquo;so we&apos;re just throwing out everything I know about designing a learning class and doing it differently?&rdquo;</strong> Yes. Correct. Welcome to the team.</p>
            </div>

            <div className="about-fact-item">
              <div className="about-fact-check"><CheckIcon /></div>
              <p className="about-fact-text"><strong>I am constantly scanning the environment for interesting nuggets of wisdom — a podcast, a random article, a conversation at a coffee shop.</strong> Everything is a learning opportunity if you&apos;re paying attention. (And I am always paying attention.)</p>
            </div>

            <div className="about-fact-item">
              <div className="about-fact-check"><CheckIcon /></div>
              <p className="about-fact-text"><strong>I built The Seat because people kept asking me how I go about building great training and for a long time I couldn&apos;t figure out how to explain it.</strong> Now I can. You&apos;re welcome.</p>
            </div>

            <div className="about-fact-item">
              <div className="about-fact-check"><CheckIcon /></div>
              <p className="about-fact-text"><strong>I learned ten years ago how to tweak PPT clip-art and remove all of the 1980s from it (well, most of it).</strong> Today? I&apos;m obsessed with Canva. How did we live without this tool?!</p>
            </div>

          </div>
        </div>
      </section>

      {/* Section 3: Currently Obsessing Over */}
      <section className="about-obsess-section">
        <div className="about-obsess-inner">

          <h2 className="about-obsess-heading">
            <span className="light">Currently </span><span className="bold">Obsessing Over</span>
          </h2>

          <div className="about-obsess-grid">

            {/* Card 1: Book */}
            <div className="about-obsess-card">
              <div className="about-obsess-card-visual obsess-book-visual">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/book_cheatatfrenchverbs.jpg" alt="How to Cheat at French Verbs" />
              </div>
              <div className="about-obsess-card-body">
                <p className="about-obsess-label">📖 Reading</p>
                <p className="about-obsess-title">How to Cheat at French Verbs</p>
                <p className="about-obsess-body">I&apos;m plodding my way from A2 to B1 French. This book is amazing — I&apos;ve read it at least four times. It reminds you that what you learned in school isn&apos;t always helpful; sometimes you have to cheat a little.</p>
              </div>
            </div>

            {/* Card 2: Claude */}
            <div className="about-obsess-card">
              <div className="about-obsess-card-visual obsess-claude-visual">
                <div className="claude-bubble user">Make it more fun. Like, actually fun.</div>
                <div className="claude-bubble assistant">I hear you. What if we tried a dark background with the book cover tilted at an angle...</div>
                <div className="claude-bubble user">YES. That.</div>
                <div className="claude-typing"><span></span><span></span><span></span></div>
              </div>
              <div className="about-obsess-card-body">
                <p className="about-obsess-label">🤖 Building</p>
                <p className="about-obsess-title">Claude (yes, this one)</p>
                <p className="about-obsess-body">I built this entire site with Claude. I have a Master&apos;s in CS and can hack my way around HTML, but wow does Claude make it easy. We got into some pretty hefty arguments about what it should look like. I think we&apos;re still friends.</p>
              </div>
            </div>

            {/* Card 3: Me time */}
            <div className="about-obsess-card">
              <div className="about-obsess-card-visual obsess-coffee-visual">
                <div className="coffee-cup-wrap">
                  <div className="coffee-steam">
                    <span></span><span></span><span></span>
                  </div>
                  <div className="coffee-emoji">☕</div>
                </div>
                <div className="coffee-phone">
                  <div className="phone-screen">
                    <div className="phone-scroll-inner">
                      <div className="phone-post"><div className="phone-post-img green"></div><div className="phone-post-lines"><div className="phone-line med"></div><div className="phone-line short"></div></div></div>
                      <div className="phone-post"><div className="phone-post-img peach"></div><div className="phone-post-lines"><div className="phone-line med"></div><div className="phone-line short"></div></div></div>
                      <div className="phone-post"><div className="phone-post-img lavender"></div><div className="phone-post-lines"><div className="phone-line med"></div><div className="phone-line short"></div></div></div>
                      <div className="phone-post"><div className="phone-post-img"></div><div className="phone-post-lines"><div className="phone-line med"></div><div className="phone-line short"></div></div></div>
                      <div className="phone-post"><div className="phone-post-img green"></div><div className="phone-post-lines"><div className="phone-line med"></div><div className="phone-line short"></div></div></div>
                      <div className="phone-post"><div className="phone-post-img peach"></div><div className="phone-post-lines"><div className="phone-line med"></div><div className="phone-line short"></div></div></div>
                      <div className="phone-post"><div className="phone-post-img lavender"></div><div className="phone-post-lines"><div className="phone-line med"></div><div className="phone-line short"></div></div></div>
                      <div className="phone-post"><div className="phone-post-img"></div><div className="phone-post-lines"><div className="phone-line med"></div><div className="phone-line short"></div></div></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="about-obsess-card-body">
                <p className="about-obsess-label">🌅 Morning ritual</p>
                <p className="about-obsess-title">My non-negotiable me time</p>
                <p className="about-obsess-body">Every morning: get up, get coffee, crawl back into bed to read, study French, or doom-scroll. I just cannot roll out of bed and start the day without this little self-cuddle. It&apos;s sacred.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 4: CTA strip */}
      <section className="about-cta-strip">
        <h3>Ready to design from <span>the seat that matters?</span></h3>
        <Link href="/session" className="about-cta-btn">Take a Seat</Link>
      </section>
    </main>
  );
}
