'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Beta signup state
  const [betaName, setBetaName] = useState('');
  const [betaEmail, setBetaEmail] = useState('');
  const [betaSubmitted, setBetaSubmitted] = useState(false);
  const [betaSubmitting, setBetaSubmitting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fullName = user.user_metadata?.full_name || '';
        const userEmail = user.email || '';
        if (fullName) { setName(fullName); setBetaName(fullName); }
        if (userEmail) { setEmail(userEmail); setBetaEmail(userEmail); }
      }
    };
    loadUser();
  }, []);

  const handleBetaSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBetaSubmitting(true);

    try {
      const supabase = createClient();
      await supabase.from('beta_requests').upsert(
        { email: betaEmail.trim().toLowerCase() },
        { onConflict: 'email' }
      );

      const formData = new FormData();
      formData.append('name', betaName);
      formData.append('email', betaEmail);
      formData.append('message', `Beta access request from ${betaName} (${betaEmail})`);
      formData.append('_subject', 'The Seat -- Beta Access Request');
      formData.append('_captcha', 'false');
      await fetch('https://formsubmit.co/ajax/theseatmethod@gmail.com', {
        method: 'POST',
        body: formData,
      });
    } catch {
      // save regardless
    }

    setBetaSubmitting(false);
    setBetaSubmitted(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('message', message);
    formData.append('_subject', 'The Seat -- Feedback');
    formData.append('_captcha', 'false');

    try {
      await fetch('https://formsubmit.co/ajax/theseatmethod@gmail.com', {
        method: 'POST',
        body: formData,
      });
    } catch {
      // show thank you regardless of network quirks
    }

    setSubmitting(false);
    setSubmitted(true);
  };

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

          <h2>Come on in. The water is warm.</h2>
          <p className="contact-subhead">
            Want early access? Have thoughts? Hit a snag? Both boxes exist for a reason. Use whichever one fits.
          </p>

          {/* ---- BETA SIGNUP ---- */}
          <div style={{
            backgroundColor: 'var(--mist)',
            borderRadius: '16px',
            padding: '28px 28px 24px',
            marginBottom: '40px',
            border: '1px solid rgba(20,144,119,0.15)',
          }}>
            <p style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#149077', margin: '0 0 8px',
              fontFamily: 'var(--font-inter-tight), sans-serif',
            }}>
              Request Beta Access
            </p>
            <h3 style={{
              fontFamily: 'var(--font-inter-tight), sans-serif',
              fontSize: '22px', fontWeight: 800, color: 'var(--evergreen)',
              margin: '0 0 8px', letterSpacing: '-0.02em',
            }}>
              Get on the list.
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(2,59,40,0.65)', margin: '0 0 20px', lineHeight: 1.55 }}>
              The Seat is in active beta. Drop your email and we will get you in.
            </p>

            {betaSubmitted ? (
              <div style={{
                padding: '16px 20px',
                backgroundColor: 'rgba(20,144,119,0.1)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ fontSize: '20px' }}>🎉</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--evergreen)', fontFamily: 'var(--font-inter-tight), sans-serif' }}>
                    You are on the list, {betaName.split(' ')[0] || 'friend'}!
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'rgba(2,59,40,0.6)' }}>
                    We will be in touch shortly.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBetaSignup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Your name"
                  required
                  value={betaName}
                  onChange={(e) => setBetaName(e.target.value)}
                  style={{ margin: 0 }}
                />
                <input
                  type="email"
                  placeholder="Your email"
                  required
                  value={betaEmail}
                  onChange={(e) => setBetaEmail(e.target.value)}
                  style={{ margin: 0 }}
                />
                <button
                  type="submit"
                  className="contact-submit"
                  disabled={betaSubmitting}
                  style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                >
                  {betaSubmitting ? 'Sending...' : 'Request access'}
                </button>
              </form>
            )}
          </div>

          {/* ---- FEEDBACK FORM ---- */}
          <p style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', margin: '0 0 8px',
            fontFamily: 'var(--font-inter-tight), sans-serif',
          }}>
            Send Feedback
          </p>
          <h3 style={{
            fontFamily: 'var(--font-inter-tight), sans-serif',
            fontSize: '22px', fontWeight: 800, color: 'var(--evergreen)',
            margin: '0 0 8px', letterSpacing: '-0.02em',
          }}>
            We are SO here for your thoughts.
          </h3>
          <p className="contact-subhead" style={{ marginBottom: '20px' }}>
            Tried it? Had a thought? Hit a snag? No support tickets, no tiers. Just you and us.
          </p>

          {submitted ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 24px',
              backgroundColor: 'rgba(2,59,40,0.03)',
              borderRadius: '16px',
            }}>
              <div style={{
                animation: 'bounceIn 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
                display: 'inline-block',
                marginBottom: '16px',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/jazzhands.png" alt="Jazz hands!" style={{ width: '100px', height: 'auto' }} />
              </div>
              <h3 style={{
                fontFamily: 'var(--font-inter-tight), sans-serif',
                color: 'var(--evergreen)', margin: '0 0 8px',
                animation: 'fadeUp 0.5s ease 0.3s both',
                fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em',
              }}>
                You just made our day.
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(2,59,40,0.65)', margin: 0, animation: 'fadeUp 0.5s ease 0.5s both' }}>
                Seriously. Every message goes straight to Julie and gets read properly. Thank you.
              </p>
            </div>
          ) : (
            <>
              <form className="contact-form" onSubmit={handleSubmit}>
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
            </>
          )}

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
