'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.user_metadata?.full_name) setName(user.user_metadata.full_name);
        if (user.email) setEmail(user.email);
      }
    };
    loadUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('message', message);
    formData.append('_subject', 'The Seat -- Beta Feedback');
    formData.append('_captcha', 'false');

    try {
      await fetch('https://formsubmit.co/theseatmethod@gmail.com', {
        method: 'POST',
        body: formData,
      });
    } catch {
      // show thank you regardless of network quirks
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main>
        <section className="contact-section">
          <div className="contact-inner" style={{ textAlign: 'center' }}>
            <div
              style={{
                animation: 'bounceIn 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
                display: 'inline-block',
                marginBottom: '24px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/jazzhands.png"
                alt="Jazz hands!"
                style={{ width: '160px', height: 'auto' }}
              />
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-inter-tight)',
                color: 'var(--evergreen)',
                marginBottom: '16px',
                animation: 'fadeUp 0.5s ease 0.3s both',
              }}
            >
              You just made our day.
            </h2>
            <p
              className="contact-subhead"
              style={{ animation: 'fadeUp 0.5s ease 0.5s both' }}
            >
              Seriously. Every message goes straight to Julie and gets read properly. Thank you for taking the time.
            </p>
          </div>
        </section>

        <style>{`
          @keyframes bounceIn {
            0%   { transform: scale(0.3) rotate(-10deg); opacity: 0; }
            50%  { transform: scale(1.1) rotate(4deg); opacity: 1; }
            70%  { transform: scale(0.95) rotate(-2deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main>
      <section className="contact-section">
        <div className="contact-inner">

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/jazzhands.png"
              alt="Jazz hands!"
              style={{ width: '72px', height: 'auto', flexShrink: 0 }}
            />
            <p className="contact-overline" style={{ margin: 0 }}>In Beta</p>
          </div>

          <h2>We are SO here for your feedback.</h2>
          <p className="contact-subhead">
            The Seat is brand new and still growing. Tried it? Had a thought? Hit a snag? Just want to tell us something? We genuinely want to hear it. No form tiers, no support tickets. Just you and us.
          </p>

          <form
            className="contact-form"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              name="name"
              placeholder="Your name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              name="email"
              placeholder="Your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <textarea
              name="message"
              placeholder="Tell us what you think..."
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            <button
              type="submit"
              className="contact-submit"
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Send feedback'}
            </button>
          </form>

          <p className="contact-footnote">
            Good feedback, bad feedback, &ldquo;this confused me&rdquo; feedback: all of it is useful. Especially the last one.
          </p>

        </div>
      </section>
    </main>
  );
}
