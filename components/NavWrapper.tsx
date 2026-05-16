'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Nav from './Nav';

export default function NavWrapper() {
  const pathname = usePathname();

  if (pathname === '/session') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(253,250,247,0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(2,59,40,0.07)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#023B28', letterSpacing: '-0.02em', fontFamily: 'var(--font-inter-tight), sans-serif' }}>
            The Seat
          </span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#149077', display: 'inline-block' }} />
        </Link>
        <Link href="/" style={{ fontSize: '13px', fontWeight: 600, color: '#149077', textDecoration: 'none', fontFamily: 'var(--font-inter-tight), sans-serif', letterSpacing: '-0.01em' }}>
          ← Back to home
        </Link>
      </div>
    );
  }

  return <Nav />;
}
