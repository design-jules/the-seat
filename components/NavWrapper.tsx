'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Image
            src="/newlogo_dark.svg"
            alt="The Seat"
            width={140}
            height={35}
            style={{ objectFit: 'contain', display: 'block' }}
            priority
          />
        </Link>
        <Link href="/" style={{ fontSize: '13px', fontWeight: 600, color: '#149077', textDecoration: 'none', fontFamily: 'var(--font-inter-tight), sans-serif', letterSpacing: '-0.01em' }}>
          ← Back to home
        </Link>
      </div>
    );
  }

  return <Nav />;
}
