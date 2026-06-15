import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getPostHogStats() {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  const projectId = process.env.POSTHOG_PROJECT_ID
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

  if (!apiKey || !projectId) return null

  const query = `
    SELECT
      count() AS pageviews,
      count(DISTINCT person_id) AS visitors
    FROM events
    WHERE event = '$pageview' AND timestamp > now() - INTERVAL 30 DAY
  `

  const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
    cache: 'no-store',
  })

  if (!res.ok) return null

  const data = await res.json()
  const row = data?.results?.[0]
  if (!row) return null

  return { pageviews: row[0] ?? 0, visitors: row[1] ?? 0 }
}
async function getMetrics() {
  const admin = createAdminClient()

  // 1. Total signups — use admin.auth.admin.listUsers() which is reliable with service role
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const totalSignups = authUsers?.length ?? 0

  // 2. Have access
  const { count: haveAccess } = await admin
    .from('approved_users')
    .select('*', { count: 'exact', head: true })

  // 3. All sessions
  const { data: allSessions } = await admin
    .from('sessions')
    .select('id, user_id, persona, training_title, created_at')
    .order('created_at', { ascending: false })

  const sessions = allSessions ?? []

  // 4. Approved user IDs
  const { data: approvedData } = await admin.from('approved_users').select('user_id')
  const approvedIds = new Set((approvedData ?? []).map(r => r.user_id))

  // 5. Activated = approved users who have at least one session
  const activatedIds = new Set(sessions.filter(s => s.user_id && approvedIds.has(s.user_id)).map(s => s.user_id))
  const activated = activatedIds.size

  // 6. Punch list sessions
  const { data: punchlistData } = await admin.from('punch_list_items').select('session_id')
  const punchlistSessionIds = new Set((punchlistData ?? []).map(r => r.session_id))
  const punchlistSessionIdsArray = Array.from(punchlistSessionIds)

  const { data: plSessions } = await admin
    .from('sessions')
    .select('user_id')
    .in('id', punchlistSessionIdsArray.length > 0 ? punchlistSessionIdsArray : ['00000000-0000-0000-0000-000000000000'])
    .not('user_id', 'is', null)
  const punchlistUserIds = new Set((plSessions ?? []).map(r => r.user_id))
  const generatedPunchlist = Array.from(punchlistUserIds).filter(id => approvedIds.has(id)).length

  // 7. Returned users (2+ sessions)
  const sessionCountByUser: Record<string, number> = {}
  for (const s of sessions) {
    if (s.user_id) sessionCountByUser[s.user_id] = (sessionCountByUser[s.user_id] ?? 0) + 1
  }
  const returned = Object.values(sessionCountByUser).filter(c => c >= 2).length

  // 8. Activation + retention rates
  const activationRate = haveAccess && haveAccess > 0 ? Math.round((activated / haveAccess) * 100) : 0

  const firstSessionByUser: Record<string, Date> = {}
  const returnedWithin14: Set<string> = new Set()
  const sortedAsc = [...sessions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  for (const s of sortedAsc) {
    if (!s.user_id) continue
    const d = new Date(s.created_at)
    if (!firstSessionByUser[s.user_id]) {
      firstSessionByUser[s.user_id] = d
    } else if (d.getTime() - firstSessionByUser[s.user_id].getTime() <= 14 * 24 * 60 * 60 * 1000) {
      returnedWithin14.add(s.user_id)
    }
  }
  const uniqueUsers = Object.keys(firstSessionByUser).length
  const retentionRate = uniqueUsers > 0 ? Math.round((returnedWithin14.size / uniqueUsers) * 100) : 0

  // 9. Enrich recent 10 sessions with email
  const recentSessions = sessions.slice(0, 10)
  const userIds = Array.from(new Set(recentSessions.map(s => s.user_id).filter(Boolean)))
  const emailMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: users } = await admin.schema('auth').from('users').select('id, email').in('id', userIds)
    for (const u of (users ?? [])) emailMap[u.id] = u.email
  }
  const enriched = recentSessions.map(s => ({
    ...s,
    email: s.user_id ? (emailMap[s.user_id] ?? 'unknown') : 'anonymous',
    hasPunchlist: punchlistSessionIds.has(s.id),
  }))

  // 10. Beta requests + codes
  const { count: betaRequests } = await admin.from('beta_requests').select('*', { count: 'exact', head: true })
  const { data: codes } = await admin.from('access_codes').select('code, note, email, created_at').order('created_at', { ascending: false })
  const generic = (codes ?? []).filter(c => c.note === 'generic').length
  const claimed = (codes ?? []).filter(c => c.note !== 'generic' && c.email).length
  const unclaimedCodes = (codes ?? []).filter(c => c.note !== 'generic' && !c.email)
  const unclaimed = unclaimedCodes.length

  // 11. Persona counts
  const personaCounts: Record<string, number> = {}
  for (const s of sessions) personaCounts[s.persona] = (personaCounts[s.persona] ?? 0) + 1

  // 12. Recent in-app emoji feedback
  const { data: feedbackData } = await admin
    .from('feedback')
    .select('rating, comment, email, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  // 13. Beta survey responses
  const { data: surveyData } = await admin
    .from('beta_survey')
    .select('email, persona_hit_hardest, after_action, realness, improvement, would_recommend, pricing, created_at')
    .order('created_at', { ascending: false })

  return {
    totalSignups,
    haveAccess: haveAccess ?? 0,
    activated,
    generatedPunchlist,
    returned,
    activationRate,
    retentionRate,
    totalSessions: sessions.length,
    recentSessions: enriched,
    betaRequests: betaRequests ?? 0,
    codes: { generic, claimed, unclaimed, unclaimedCodes },
    personaCounts,
    feedback: feedbackData ?? [],
    survey: surveyData ?? [],
  }
}

export default async function AdminPage({ searchParams }: { searchParams: { key?: string } }) {
  // Simple password protection via query param — works regardless of session middleware
  const secret = process.env.ADMIN_SECRET
  if (!secret || searchParams.key !== secret) {
    redirect('/')
  }

    let m
  let postHog
  try {
    m = await getMetrics()
    postHog = await getPostHogStats()
  } catch (e) {
    return (
      <main style={{ padding: '60px 40px', fontFamily: 'monospace' }}>
        <h1>Dashboard error</h1>
        <p>Check that SUPABASE_SERVICE_ROLE_KEY is set in Vercel env vars.</p>
        <pre style={{ fontSize: '12px', color: 'red' }}>{String(e)}</pre>
      </main>
    )
  }

  const now = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' })
  const personaLabel: Record<string, string> = { skeptic: 'Dana', slammed: 'Marcus', hype: 'Bex' }
  const ratingEmoji = ['', '😕', '😐', '😊', '🤩']
  const realnessLabel: Record<number, string> = { 1: '😐 Felt scripted', 2: '😊 Pretty believable', 3: '🤩 Uncomfortably accurate' }
  const afterActionLabel: Record<string, string> = { fixed: 'Fixed things immediately', shared: 'Forwarded to team', thinking: 'Still thinking', alot: 'Needed a minute' }
  const recommendLabel: Record<string, string> = { already: 'Already recommended it', yes: 'Yes, absolutely', probably: 'Probably', later: 'Ask me later' }
  const pricingLabel: Record<string, string> = { free: 'Needs to be free', low: 'Under $15/mo', mid: '$20-40/mo', high: '$50+/mo (company pays)' }

  return (
    <main style={{ minHeight: '100vh', background: '#F4F1EC', padding: '40px 24px', fontFamily: 'var(--font-inter-tight), sans-serif' }}>
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>

        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.45)', margin: '0 0 6px' }}>The Seat</p>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#023B28', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Beta Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'rgba(2,59,40,0.4)', margin: 0 }}>Last loaded: {now} PT · <a href={`?key=${searchParams.key}`} style={{ color: '#149077' }}>Refresh</a></p>
        </div>

        {/* 6 key metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Have Access', value: m.haveAccess, sub: `${m.totalSignups} total signups` },
            { label: 'Activated', value: m.activated, sub: 'ran ≥ 1 session' },
            { label: 'Punch Lists', value: m.generatedPunchlist, sub: `${m.totalSessions} total sessions` },
            { label: 'Returned', value: m.returned, sub: 'ran ≥ 2 sessions' },
            { label: 'Activation Rate', value: `${m.activationRate}%`, sub: 'activated / have access' },
            { label: 'Retention (14d)', value: `${m.retentionRate}%`, sub: 'returned within 14 days' },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(2,59,40,0.08)' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', margin: '0 0 8px' }}>{label}</p>
              <p style={{ fontSize: '36px', fontWeight: 800, color: '#023B28', margin: '0 0 4px', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: '12px', color: 'rgba(2,59,40,0.4)', margin: 0 }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Site traffic (PostHog) */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(2,59,40,0.08)', marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', margin: '0 0 16px' }}>Site Traffic — Last 30 Days</p>
          {postHog ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '36px', fontWeight: 800, color: '#023B28', margin: '0 0 4px', letterSpacing: '-0.03em', lineHeight: 1 }}>{postHog.pageviews}</p>
                <p style={{ fontSize: '12px', color: 'rgba(2,59,40,0.4)', margin: 0 }}>pageviews</p>
              </div>
              <div>
                <p style={{ fontSize: '36px', fontWeight: 800, color: '#023B28', margin: '0 0 4px', letterSpacing: '-0.03em', lineHeight: 1 }}>{postHog.visitors}</p>
                <p style={{ fontSize: '12px', color: 'rgba(2,59,40,0.4)', margin: 0 }}>unique visitors</p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'rgba(2,59,40,0.4)', margin: 0 }}>
              Not configured — set <code>POSTHOG_PERSONAL_API_KEY</code> and <code>POSTHOG_PROJECT_ID</code> in Vercel env vars.
            </p>
          )}
        </div>

        
        {/* Persona + codes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(2,59,40,0.08)' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', margin: '0 0 16px' }}>Persona Sessions</p>
            {['skeptic', 'slammed', 'hype'].map(p => (
              <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#023B28' }}>{personaLabel[p]}</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#149077' }}>{m.personaCounts[p] ?? 0}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(2,59,40,0.08)' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', margin: '0 0 16px' }}>Access + Requests</p>
            {[
              { label: 'Generic codes (reusable)', value: m.codes.generic },
              { label: 'Claimed codes', value: m.codes.claimed },
              { label: 'Unclaimed codes', value: m.codes.unclaimed },
              { label: 'Beta requests waiting', value: m.betaRequests },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(2,59,40,0.7)' }}>{label}</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#023B28' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unclaimed codes */}
        {m.codes.unclaimedCodes.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(2,59,40,0.08)', marginBottom: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', margin: '0 0 16px' }}>Unclaimed Codes</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>{['Code', 'Label / Note', 'Created'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontWeight: 700, color: 'rgba(2,59,40,0.45)', paddingBottom: '10px', borderBottom: '1px solid rgba(2,59,40,0.08)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {m.codes.unclaimedCodes.map((c, i) => (
                  <tr key={c.code} style={{ borderBottom: i < m.codes.unclaimedCodes.length - 1 ? '1px solid rgba(2,59,40,0.06)' : 'none' }}>
                    <td style={{ padding: '9px 0' }}>
                      <code style={{ fontSize: '13px', fontWeight: 800, color: '#023B28', background: 'rgba(2,59,40,0.06)', padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.05em' }}>{c.code}</code>
                    </td>
                    <td style={{ padding: '9px 0', color: 'rgba(2,59,40,0.55)' }}>{c.note || '—'}</td>
                    <td style={{ padding: '9px 0', color: 'rgba(2,59,40,0.4)' }}>{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recent sessions */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(2,59,40,0.08)', marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', margin: '0 0 16px' }}>Recent Sessions</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>{['Date', 'Persona', 'User', 'Training', 'List?'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontWeight: 700, color: 'rgba(2,59,40,0.45)', paddingBottom: '10px', borderBottom: '1px solid rgba(2,59,40,0.08)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {m.recentSessions.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < m.recentSessions.length - 1 ? '1px solid rgba(2,59,40,0.06)' : 'none' }}>
                  <td style={{ padding: '9px 0', color: 'rgba(2,59,40,0.55)' }}>{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td style={{ padding: '9px 0', fontWeight: 600, color: '#023B28' }}>{personaLabel[s.persona] ?? s.persona}</td>
                  <td style={{ padding: '9px 0', color: 'rgba(2,59,40,0.55)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</td>
                  <td style={{ padding: '9px 0', color: 'rgba(2,59,40,0.4)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.training_title || '—'}</td>
                  <td style={{ padding: '9px 0' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: s.hasPunchlist ? '#149077' : 'rgba(2,59,40,0.08)', color: s.hasPunchlist ? '#fff' : 'rgba(2,59,40,0.4)' }}>
                      {s.hasPunchlist ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Feedback */}
        {m.feedback.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(2,59,40,0.08)' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', margin: '0 0 16px' }}>Recent Feedback</p>
            {m.feedback.map((f, i) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: i < m.feedback.length - 1 ? '1px solid rgba(2,59,40,0.06)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: f.comment ? '4px' : 0 }}>
                  <span style={{ fontSize: '20px' }}>{ratingEmoji[f.rating ?? 0]}</span>
                  {f.email && <span style={{ fontSize: '12px', color: '#149077', fontWeight: 600 }}>{f.email}</span>}
                  <span style={{ fontSize: '11px', color: 'rgba(2,59,40,0.35)', marginLeft: 'auto' }}>{new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                {f.comment && <p style={{ fontSize: '14px', color: 'rgba(2,59,40,0.7)', margin: '4px 0 0 30px', lineHeight: 1.5 }}>{f.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Beta survey responses */}
        {m.survey.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(2,59,40,0.08)', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', margin: 0 }}>Beta Survey — {m.survey.length} response{m.survey.length !== 1 ? 's' : ''}</p>
            </div>
            {m.survey.map((r, i) => (
              <div key={i} style={{ padding: '16px 0', borderBottom: i < m.survey.length - 1 ? '1px solid rgba(2,59,40,0.06)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#149077' }}>{r.email || 'Anonymous'}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(2,59,40,0.35)' }}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: r.improvement ? '10px' : 0 }}>
                  {r.persona_hit_hardest && <div style={{ fontSize: '12px', color: 'rgba(2,59,40,0.6)' }}>Persona: <strong style={{ color: '#023B28' }}>{r.persona_hit_hardest === 'all' ? 'All three' : personaLabel[r.persona_hit_hardest]}</strong></div>}
                  {r.realness && <div style={{ fontSize: '12px', color: 'rgba(2,59,40,0.6)' }}>Realness: <strong style={{ color: '#023B28' }}>{realnessLabel[r.realness]}</strong></div>}
                  {r.after_action && <div style={{ fontSize: '12px', color: 'rgba(2,59,40,0.6)' }}>After: <strong style={{ color: '#023B28' }}>{afterActionLabel[r.after_action] ?? r.after_action}</strong></div>}
                  {r.would_recommend && <div style={{ fontSize: '12px', color: 'rgba(2,59,40,0.6)' }}>Recommend: <strong style={{ color: '#023B28' }}>{recommendLabel[r.would_recommend] ?? r.would_recommend}</strong></div>}
                  {r.pricing && <div style={{ fontSize: '12px', color: 'rgba(2,59,40,0.6)' }}>Pricing: <strong style={{ color: '#023B28' }}>{pricingLabel[r.pricing] ?? r.pricing}</strong></div>}
                </div>
                {r.improvement && <p style={{ fontSize: '13px', color: 'rgba(2,59,40,0.7)', margin: 0, lineHeight: 1.5, background: 'rgba(2,59,40,0.04)', padding: '10px 14px', borderRadius: '8px' }}>&ldquo;{r.improvement}&rdquo;</p>}
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
