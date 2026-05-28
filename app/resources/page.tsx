export default function Resources() {
  return (
    <main>
      <section className="section resources-section">
        <div className="section-inner">
          <p className="eyebrow eyebrow-center">Free downloads</p>
          <h2 className="display display-center" style={{ marginBottom: '12px' }}>Tools to take with you.</h2>
          <p className="resources-sub">No email required. Just useful stuff.</p>

          <div className="resources-grid">

            {/* Before You Take a Seat */}
            <div className="resource-card">
              <div className="resource-cover resource-cover-checklist">
                <span className="resource-cover-brand">The Seat</span>
                <div>
                  <div className="resource-cover-title">Before You<br />Take a Seat</div>
                </div>
                <span className="resource-cover-tag tag-checklist">Checklist</span>
              </div>
              <div className="resource-body">
                <h3>Before You Take a Seat</h3>
                <p>At some point, every L&amp;D person has sat in a review meeting thinking &ldquo;how did we get here.&rdquo; And every leader has thought the exact same thing from the other side of the table. Most of those fixes? They could have happened before anyone took a seat. This is how you make sure they do.</p>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px', marginTop: '-4px' }}>
                  Leaders: share this checklist with your team.<br />
                  Designers: tick these off before you share.
                </p>
                <a href="/resources/before-you-take-a-seat.pdf" download className="btn-download">↓ Download PDF</a>
              </div>
            </div>

            {/* Sparkle Dust Starter Kit — coming soon */}
            <div className="resource-card resource-card-soon">
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
                <div className="resources-coming-pill" style={{ display: 'inline-block', marginTop: '4px' }}>Coming soon</div>
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
