'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSignInWithGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

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
      await fetch('https://formsubmit.co/ajax/theseatmethod@gmail.com', { method: 'POST', body: formData });
    } catch { /* save regardless */ }
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
      await fetch('https://formsubmit.co/ajax/theseatmethod@gmail.com', { method: 'POST', body: formData });
    } catch { /* show success regardless */ }
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <main style={{ background: 'var(--cream)', minHeight: '100vh', paddingTop: '80px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '60px 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/jazzhands.png"
          alt="Jazz hands!"
          style={{ width: '160px', height: 'auto', marginBottom: '24px', display: 'block' }}
        />
        <p style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#149077', margin: '0 0 10px',
          fontFamily: 'var(--font-inter-tight), sans-serif',
        }}>In Beta</p>
        <h1 style={{
          fontFamily: 'var(--font-inter-tight), sans-serif',
          fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 800,
          color: 'var(--evergreen)', letterSpacing: '-0.03em',
          lineHeight: 1.1, margin: '0 auto 16px', maxWidth: '600px',
        }}>
          Get ready to party.
        </h1>
        <p style={{
          fontSize: '18px', color: 'rgba(2,59,40,0.6)', maxWidth: '480px',
          margin: '0 auto', lineHeight: 1.6, fontWeight: 300,
        }}>
          Whether you want in or you have thoughts to share, we want to hear from you.
        </p>
      </div>

      {/* Two columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        maxWidth: '960px',
        margin: '0 auto',
        padding: '0 24px 80px',
        alignItems: 'start',
      }}>

        {/* LEFT — Beta access */}
        <div style={{
          background: 'var(--mist)',
          borderRadius: '20px',
          padding: '36px 32px',
          border: '1px solid rgba(20,144,119,0.15)',
        }}>
          <p style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#149077', margin: '0 0 10px',
            fontFamily: 'var(--font-inter-tight), sans-serif',
          }}>Want early access?</p>
          <h2 style={{
            fontFamily: 'var(--font-inter-tight), sans-serif',
            fontSize: '26px', fontWeight: 800, color: 'var(--evergreen)',
            margin: '0 0 10px', letterSpacing: '-0.02em',
          }}>Get on the list.</h2>
          <p style={{ fontSize: '15px', color: 'rgba(2,59,40,0.6)', margin: '0 0 24px', lineHeight: 1.55 }}>
            The Seat is in active beta. Sign in with Google for instant access, or drop your email and we will get you in shortly.
          </p>

          {betaSubmitted ? (
            <div style={{
              padding: '16px 20px', backgroundColor: 'rgba(20,144,119,0.12)',
              borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '24px' }}>🎉</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: 'var(--evergreen)', fontFamily: 'var(--font-inter-tight), sans-serif' }}>
                  You are on the list{betaName ? `, ${betaName.split(' ')[0]}` : ''}!
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'rgba(2,59,40,0.55)' }}>
                  We will be in touch shortly.
                </p>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={handleSignInWithGoogle}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', padding: '13px 20px', borderRadius: '10px',
                  border: '1.5px solid rgba(2,59,40,0.15)', background: '#fff',
                  fontSize: '15px', fontWeight: 600, color: 'var(--evergreen)',
                  cursor: 'pointer', fontFamily: 'var(--font-inter-tight), sans-serif',
                  marginBottom: '16px', transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Sign in with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 16px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(2,59,40,0.12)' }} />
                <span style={{ fontSize: '12px', color: 'rgba(2,59,40,0.4)', fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(2,59,40,0.12)' }} />
              </div>

              <form onSubmit={handleBetaSignup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Your name"
                  required
                  value={betaName}
                  onChange={(e) => setBetaName(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: '1.5px solid rgba(2,59,40,0.15)', background: '#fff',
                    fontSize: '15px', color: 'var(--evergreen)', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
                <input
                  type="email"
                  placeholder="Your email"
                  required
                  value={betaEmail}
                  onChange={(e) => setBetaEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: '1.5px solid rgba(2,59,40,0.15)', background: '#fff',
                    fontSize: '15px', color: 'var(--evergreen)', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
                <button
                  type="submit"
                  disabled={betaSubmitting}
                  style={{
                    background: 'var(--jungle)', color: '#fff', border: 'none',
                    borderRadius: '100px', padding: '13px 28px',
                    fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'var(--font-inter-tight), sans-serif',
                    marginTop: '4px', transition: 'background 0.2s',
                  }}
                >
                  {betaSubmitting ? 'Sending...' : 'Request access'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* RIGHT — Feedback */}
        <div style={{
          background: 'var(--lavender)',
          borderRadius: '20px',
          padding: '36px 32px',
          border: '1px solid rgba(155,114,200,0.2)',
        }}>
          <p style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#7c4dbd', margin: '0 0 10px',
            fontFamily: 'var(--font-inter-tight), sans-serif',
          }}>Have feedback?</p>
          <h2 style={{
            fontFamily: 'var(--font-inter-tight), sans-serif',
            fontSize: '26px', fontWeight: 800, color: 'var(--evergreen)',
            margin: '0 0 10px', letterSpacing: '-0.02em',
          }}>We are SO here for it.</h2>
          <p style={{ fontSize: '15px', color: 'rgba(2,59,40,0.6)', margin: '0 0 24px', lineHeight: 1.55 }}>
            Tried it? Had a thought? Hit a snag? No support tickets, no tiers. Just you and us.
          </p>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ animation: 'bounceIn 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97)', display: 'inline-block', marginBottom: '16px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/jazzhands.png" alt="Jazz hands!" style={{ width: '80px', height: 'auto' }} />
              </div>
              <h3 style={{
                fontFamily: 'var(--font-inter-tight), sans-serif',
                color: 'var(--evergreen)', margin: '0 0 8px',
                fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em',
                animation: 'fadeUp 0.5s ease 0.3s both',
              }}>You just made our day.</h3>
              <p style={{ fontSize: '14px', color: 'rgba(2,59,40,0.6)', margin: 0, animation: 'fadeUp 0.5s ease 0.5s both' }}>
                Every message goes straight to Julie and gets read properly. Thank you.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Your name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: '1.5px solid rgba(155,114,200,0.25)', background: '#fff',
                    fontSize: '15px', color: 'var(--evergreen)', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
                <input
                  type="email"
                  placeholder="Your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: '1.5px solid rgba(155,114,200,0.25)', background: '#fff',
                    fontSize: '15px', color: 'var(--evergreen)', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
                <textarea
                  placeholder="Tell us what you think..."
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: '1.5px solid rgba(155,114,200,0.25)', background: '#fff',
                    fontSize: '15px', color: 'var(--evergreen)', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    minHeight: '130px', resize: 'vertical', lineHeight: 1.55,
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    background: '#7c4dbd', color: '#fff', border: 'none',
                    borderRadius: '100px', padding: '13px 28px',
                    fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'var(--font-inter-tight), sans-serif',
                    marginTop: '4px', transition: 'background 0.2s', alignSelf: 'flex-start',
                  }}
                >
                  {submitting ? 'Sending...' : 'Send feedback'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(2,59,40,0.4)', marginTop: '16px', lineHeight: 1.5 }}>
                Good feedback, bad feedback, &ldquo;this confused me&rdquo; feedback: all of it is useful. Especially the last one.
              </p>
            </>
          )}
        </div>

      </div>

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
