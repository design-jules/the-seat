export default function Resources() {
  return (
    <main>
      <section className="section resources-section">
        <div className="section-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/jazzhands.png"
            alt="Jazz hands!"
            style={{ width: '160px', height: 'auto', display: 'block', margin: '0 auto 24px' }}
          />
          <p className="eyebrow eyebrow-center">Free downloads</p>
          <h2 className="display display-center" style={{ marginBottom: '12px' }}>Tools to take with you.</h2>
          <p className="resources-sub">No email required. Just useful stuff.</p>

          <div className="resources-grid">

            {/* Pre-Review Checklist */}
            <div className="resource-card">
              <div className="resource-cover resource-cover-checklist">
                <span className="resource-cover-brand">The Seat</span>
                <div>
                  <div className="resource-cover-title">Pre-Review<br />Checklist</div>
                </div>
                <span className="resource-cover-tag tag-checklist">Checklist</span>
              </div>
              <div className="resource-body">
                <h3>Pre-Review Checklist</h3>
                <p>For L&amp;D leaders reviewing training submissions. Covers point of class, audience, desired behavior, survey questions, engagement ratios, and design standards.</p>
                <button className="btn-download">↓ Download PDF</button>
              </div>
            </div>

            {/* Sparkle Dust Starter Kit */}
            <div className="resource-card">
              <div className="resource-cover resource-cover-sparkle">
                <span className="resource-cover-brand">The Seat</span>
                <div>
                  <div className="resource-cover-title">Sparkle Dust<br />Starter Kit</div>
                </div>
                <span className="resource-cover-tag tag-sparkle">Starter Kit</span>
              </div>
              <div className="resource-body">
                <h3>Sparkle Dust Starter Kit</h3>
                <p>Ideas for engagement moments: analogies, games, ice breakers. Includes the World&apos;s Best Ice Breakers and more.</p>
                <button className="btn-download">↓ Download PDF</button>
              </div>
            </div>

          </div>

          {/* More coming soon */}
          <div className="resources-coming-soon">
            <div className="resources-coming-soon-text">
              <h3>More resources on the way.</h3>
              <p>New tools, frameworks, and templates being added regularly.</p>
            </div>
            <div className="resources-coming-pill">More coming soon</div>
          </div>

        </div>
      </section>
    </main>
  );
}
