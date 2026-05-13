export default function Contact() {
  return (
    <main>
      <section className="contact-section">
        <div className="contact-inner">

          <p className="contact-overline">In Beta</p>
          <h2>This is a beta. And we want to know what you think.</h2>
          <p className="contact-subhead">The Seat is brand new and we&apos;re still building. If you tried it, had a thought, hit a snag, or just want to tell us something — we want to hear it. No form tiers, no support tickets. Just tell us.</p>

          <form
            className="contact-form"
            action="https://formsubmit.co/theseatmethod@gmail.com"
            method="POST"
          >
            <input type="hidden" name="_subject" value="The Seat — Beta Feedback" />
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_next" value="about:blank" />
            <input type="text" name="name" placeholder="Your name" required />
            <input type="email" name="email" placeholder="Your email" required />
            <textarea name="message" placeholder="Tell us what you think..." required></textarea>
            <button type="submit" className="contact-submit">Send feedback</button>
          </form>

          <p className="contact-footnote">Good feedback, bad feedback, &ldquo;this confused me&rdquo; feedback — all of it is useful. Especially the last one.</p>

        </div>
      </section>
    </main>
  );
}
