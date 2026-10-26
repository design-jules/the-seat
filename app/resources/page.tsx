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
              <div className="resource-cover resource-cover-checklist" style={{ justifyContent: 'flex-end' }}>
                {/* PDF thumbnail peeking from top-right */}
                <div style={{ position: 'absolute', top: '-10px', right: '24px', width: '130px', height: '190px', overflow: 'hidden', borderRadius: '5px', boxShadow: '0 12px 32px rgba(2,59,40,0.22)', transform: 'rotate(2deg)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/resources/before-you-take-a-seat-preview.png"
                    alt="Before You Take a Seat checklist preview"
                    style={{ width: '100%', display: 'block', objectFit: 'cover', objectPosition: 'top' }}
                  />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div className="resource-cover-title" style={{ color: '#023B28', maxWidth: '55%' }}>Before You<br />Take a Seat</div>
                </div>
                <span className="resource-cover-tag tag-checklist">Checklist</span>
              </div>
              <div className="resource-body">
                <h3>Before You Take a Seat</h3>
                <p>You know that moment in a review when someone flags something you could have caught at your desk? This checklist is the thing you run before that. Short, specific, and worth the five minutes.</p>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px', marginTop: '-4px' }}>
                  Designers: tick these off before you share.<br />
                  Leaders: send it to your team.
                </p>
                <a href="/resources/before-you-take-a-seat.pdf" download className="btn-download">↓ Download PDF</a>
              </div>
            </div>

          </div>

        </div>
      </section>
    </main>
  );
}
