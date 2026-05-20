'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || null;

  return (
    <nav>
      <div className="nav-left">
        <Link href="/" className="nav-brand">
          <Image
            src="/Logo_White_theLime_Green_Bkg.png"
            alt="The Seat"
            width={100}
            height={44}
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
        {user && (
          <Link href="/sessions" className="nav-tab" style={{ borderBottom: 'none', fontSize: '13px' }}>
            My Sessions
          </Link>
        )}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#023B28', opacity: 0.6 }}>
              Hey, {firstName}
            </span>
            <button className="btn-signin" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        ) : (
          <button className="btn-signin" onClick={handleSignIn}>
            Sign in with Google
          </button>
        )}
      </div>
    </nav>
  );
}
