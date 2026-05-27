import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-copy">© 2026 The Seat. All rights reserved.</p>
        <nav className="site-footer-links">
          <Link href="/terms">Terms &amp; Conditions</Link>
        </nav>
      </div>
    </footer>
  );
}
