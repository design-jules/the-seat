export const metadata = {
  title: 'Terms & Conditions — The Seat',
};

export default function Terms() {
  return (
    <main style={{ backgroundColor: '#FDFAF7', minHeight: '100vh', paddingTop: '80px' }}>
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: 'clamp(40px, 6vw, 80px) clamp(24px, 5vw, 48px) 80px',
        fontFamily: 'var(--font-inter-tight), sans-serif',
        color: '#023B28',
      }}>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px' }}>
          Terms &amp; Conditions
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(2,59,40,0.45)', marginBottom: '48px', fontWeight: 500 }}>
          The Seat &nbsp;·&nbsp; Last Updated: May 27, 2026
        </p>

        <p style={body}>Please read these Terms and Conditions (&ldquo;Terms&rdquo;) carefully before using The Seat (the &ldquo;Service&rdquo;), operated by The Seat (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By creating an account or accessing the Service in any way, you agree to be bound by these Terms. If you do not agree, do not use the Service.</p>

        <hr style={rule} />

        <h2 style={h2}>1. Beta Service</h2>
        <p style={body}>The Service is currently provided in beta form. This means:</p>
        <ul style={list}>
          <li>Features, functionality, and pricing are subject to change at any time without notice.</li>
          <li>The Service may contain bugs, errors, or interruptions.</li>
          <li>We reserve the right to discontinue, modify, or restrict access to the Service at any time and for any reason.</li>
          <li>Access during beta does not guarantee continued access, including after the introduction of paid tiers.</li>
        </ul>
        <p style={body}>Your use of the beta Service is at your sole risk.</p>

        <hr style={rule} />

        <h2 style={h2}>2. Accounts</h2>
        <p style={body}>To access the Service, you must create an account. You agree to provide accurate information, keep your credentials confidential, and be solely responsible for all activity under your account. You must be at least 18 years of age to register.</p>
        <p style={body}>We reserve the right to suspend or terminate your account at any time, with or without cause or notice, including for any violation of these Terms.</p>

        <hr style={rule} />

        <h2 style={h2}>3. Intellectual Property</h2>
        <p style={body}>All content, code, design, graphics, logos, trademarks, and features of the Service are the exclusive property of The Seat and are protected by applicable intellectual property laws.</p>
        <p style={body}>You are granted a limited, non-exclusive, non-transferable, revocable license solely to access and use the Service for your own personal, non-commercial purposes. This license does not permit you to:</p>
        <ul style={list}>
          <li>Copy, reproduce, distribute, or publicly display any part of the Service.</li>
          <li>Modify, adapt, or create derivative works based on the Service.</li>
          <li>Reverse engineer, decompile, or attempt to extract the source code of the Service.</li>
          <li>Remove or alter any copyright, trademark, or other proprietary notices.</li>
        </ul>

        <hr style={rule} />

        <h2 style={h2}>4. Prohibited Uses</h2>
        <p style={body}>You agree not to use the Service to:</p>
        <ul style={list}>
          <li>Violate any applicable law or regulation.</li>
          <li>Scrape, crawl, or collect data using bots, automated tools, or any other means.</li>
          <li>Use the Service for competitive intelligence or to build a competing product.</li>
          <li>Attempt to gain unauthorized access to any part of the Service or its systems.</li>
          <li>Interfere with or disrupt the integrity or performance of the Service.</li>
          <li>Transmit any malicious code, viruses, or harmful data.</li>
        </ul>

        <hr style={rule} />

        <h2 style={h2}>5. Freemium Pricing &amp; Future Paid Tiers</h2>
        <p style={body}>The Service is currently offered free of charge during the beta period. We reserve the right to introduce paid tiers at any time. You will be given reasonable notice of any pricing changes. Beta access does not entitle you to free access once paid tiers are introduced, unless explicitly communicated in writing.</p>

        <hr style={rule} />

        <h2 style={h2}>6. Disclaimer of Warranties</h2>
        <p style={body}>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.</p>

        <hr style={rule} />

        <h2 style={h2}>7. Limitation of Liability</h2>
        <p style={body}>TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SEAT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.</p>

        <hr style={rule} />

        <h2 style={h2}>8. Indemnification</h2>
        <p style={body}>You agree to indemnify and hold harmless The Seat and its officers, directors, employees, and agents from any claims, liabilities, damages, or expenses arising out of your use of the Service or violation of these Terms.</p>

        <hr style={rule} />

        <h2 style={h2}>9. Termination</h2>
        <p style={body}>We may terminate or suspend your access immediately, without prior notice, for any reason including breach of these Terms. All provisions that by their nature should survive termination will do so.</p>

        <hr style={rule} />

        <h2 style={h2}>10. Changes to These Terms</h2>
        <p style={body}>We reserve the right to modify these Terms at any time. We will update the &ldquo;Last Updated&rdquo; date at the top of this page. Continued use of the Service after changes constitutes your acceptance of the revised Terms.</p>

        <hr style={rule} />

        <h2 style={h2}>11. Governing Law</h2>
        <p style={body}>These Terms are governed by the laws of the State of Washington, United States. Any disputes shall be resolved exclusively in the state or federal courts located in King County, Washington.</p>

        <hr style={rule} />

        <h2 style={h2}>12. Contact Us</h2>
        <p style={body}>If you have any questions about these Terms, please contact us at:{' '}
          <a href="mailto:theseatmethod@gmail.com" style={{ color: '#149077', fontWeight: 600, textDecoration: 'none' }}>
            theseatmethod@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}

const h2: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  marginTop: '0',
  marginBottom: '12px',
  color: '#023B28',
};

const body: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.7,
  color: 'rgba(2,59,40,0.8)',
  marginBottom: '14px',
};

const list: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.7,
  color: 'rgba(2,59,40,0.8)',
  marginBottom: '14px',
  paddingLeft: '24px',
};

const rule: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid rgba(2,59,40,0.1)',
  margin: '36px 0',
};
