'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/session', label: 'Take a Seat' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
  { href: '/resources', label: 'Resources' },
  { href: '/contact', label: 'Contact' },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showSignInDropdown, setShowSignInDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signInLoading, setSignInLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSignInDropdown(false);
      }
    };
    if (showSignInDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSignInDropdown]);

  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleEmailSignIn = async () => {
    if (!signInEmail || !signInPassword) return;
    setSignInLoading(true);
    setSignInError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword });
    if (error) {
      setSignInError('Invalid email or password.');
      setSignInLoading(false);
    } else {
      setShowSignInDropdown(false);
      setSignInEmail('');
      setSignInPassword('');
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || null;

  return (
    <>
    <nav>
      <div className="nav-left">
        <Link href="/" className="nav-brand">
          <Image
            src="/newlogo.svg"
            alt="The Seat"
            width={140}
            height={35}
            style={{ objectFit: 'contain', display: 'block' }}
            priority
          />
        </Link>
        <div className="nav-tabs">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-tab${pathname === link.href ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="nav-right">
        {/* Hamburger — only visible at ≤900px */}
        <button
          className="nav-hamburger"
          onClick={() => setShowMobileMenu(prev => !prev)}
          aria-label="Toggle menu"
        >
          {showMobileMenu ? '✕' : '☰'}
        </button>
        {user && (
          <Link href="/sessions" className="nav-tab" style={{ borderBottom: 'none', fontSize: '13px' }}>
            My Sessions
          </Link>
        )}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(253,250,247,0.6)' }}>
              Hey, {firstName}
            </span>
            <button className="btn-signin" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} ref={dropdownRef}>
            <Link href="/contact" className="btn-signup-nav">
              Sign Up
            </Link>
            <button className="btn-signin" onClick={() => setShowSignInDropdown(prev => !prev)}>
              Sign In
            </button>
            {showSignInDropdown && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                backgroundColor: '#fff', borderRadius: '16px',
                padding: '24px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                width: '300px', zIndex: 200,
                fontFamily: 'var(--font-inter-tight), sans-serif',
                border: '1px solid rgba(2,59,40,0.08)',
              }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#023B28', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
                  Sign in to your account
                </p>
                <button
                  onClick={handleGoogleSignIn}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '10px', padding: '11px 16px', borderRadius: '10px',
                    border: '1.5px solid rgba(2,59,40,0.15)', background: '#fff',
                    fontSize: '14px', fontWeight: 600, color: '#023B28',
                    cursor: 'pointer', fontFamily: 'inherit', marginBottom: '14px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                  </svg>
                  Sign in with Google
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(2,59,40,0.1)' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(2,59,40,0.35)', fontWeight: 500 }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(2,59,40,0.1)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="email"
                    placeholder="Email"
                    value={signInEmail}
                    onChange={e => { setSignInEmail(e.target.value); setSignInError(null); }}
                    onKeyDown={e => e.key === 'Enter' && handleEmailSignIn()}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      border: '1.5px solid rgba(2,59,40,0.15)', fontSize: '14px',
                      fontFamily: 'inherit', color: '#023B28', outline: 'none',
                      boxSizing: 'border-box' as const,
                    }}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={signInPassword}
                    onChange={e => { setSignInPassword(e.target.value); setSignInError(null); }}
                    onKeyDown={e => e.key === 'Enter' && handleEmailSignIn()}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      border: '1.5px solid rgba(2,59,40,0.15)', fontSize: '14px',
                      fontFamily: 'inherit', color: '#023B28', outline: 'none',
                      boxSizing: 'border-box' as const,
                    }}
                  />
                  {signInError && (
                    <p style={{ fontSize: '12px', color: '#dc2626', margin: 0, fontWeight: 500 }}>{signInError}</p>
                  )}
                  <button
                    onClick={handleEmailSignIn}
                    disabled={signInLoading || !signInEmail || !signInPassword}
                    style={{
                      background: signInEmail && signInPassword ? '#149077' : 'rgba(2,59,40,0.12)',
                      color: signInEmail && signInPassword ? '#fff' : 'rgba(2,59,40,0.3)',
                      border: 'none', borderRadius: '8px', padding: '10px 16px',
                      fontSize: '14px', fontWeight: 700, cursor: signInEmail && signInPassword ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit', transition: 'background 0.15s',
                    }}
                  >
                    {signInLoading ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(2,59,40,0.4)', margin: '12px 0 0', lineHeight: 1.5 }}>
                  Don&apos;t have an account?{' '}
                  <Link href="/contact" onClick={() => setShowSignInDropdown(false)} style={{ color: '#149077', fontWeight: 600, textDecoration: 'none' }}>
                    Sign up here
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>

    {/* Mobile nav dropdown — slides in below nav at ≤900px */}
    {showMobileMenu && (
      <div className="nav-mobile-menu">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="nav-mobile-link"
            onClick={() => setShowMobileMenu(false)}
          >
            {link.label}
          </Link>
        ))}
        {user && (
          <Link href="/sessions" className="nav-mobile-link" onClick={() => setShowMobileMenu(false)}>
            My Sessions
          </Link>
        )}
        <div className="nav-mobile-divider" />
        {user ? (
          <button
            className="nav-mobile-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', padding: 0, width: '100%' }}
            onClick={() => { handleSignOut(); setShowMobileMenu(false); }}
          >
            Sign out ({firstName})
          </button>
        ) : (
          <>
            <Link href="/contact" className="nav-mobile-link" onClick={() => setShowMobileMenu(false)}>
              Sign Up
            </Link>
            <Link href="#" className="nav-mobile-link" onClick={(e) => { e.preventDefault(); setShowMobileMenu(false); setShowSignInDropdown(true); }}>
              Sign In
            </Link>
          </>
        )}
      </div>
    )}
    </>
  );
}
