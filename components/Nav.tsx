'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  return (
    <nav>
      <div className="nav-left">
        <Link href="/" className="nav-brand">
          <span className="nav-brand-name">The Seat</span>
          <span className="nav-dot" />
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
        <Link href="/sessions" className="nav-tab" style={{ borderBottom: 'none', fontSize: '13px' }}>
          My Sessions
        </Link>
        <button className="btn-signin">Sign in with Google</button>
      </div>
    </nav>
  );
}
