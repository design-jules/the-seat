import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

async function getMetrics() {
  const admin = createAdminClient()

  // 1. Total signups (auth.users) — correct schema() position
  const { count: totalSignups } = await admin
    .schema('auth')
    .from('users')
    .select('*', { count: 'exact', head: true })

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

  const { data: plSessions } = await admin
    .from('sessions')
    .select('user_id')
    .in('id', punchlistSessionIds.size > 0 ? [...punchlistSessionIds] : ['00000000-0000-0000-0000-000000000000'])
    .not('user_id', 'is', null)
  const punchlistUserIds = new Set((plSessions ?? []).map(r => r.user_id))
  const generatedPunchlist = [...punchlistUserIds].filter(id => approvedIds.has(id)).length

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
  const userIds = [...new Set(recentSessions.map(s => s.user_id).filter(Boolean))]
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
  const { data: codes } = await admin.from('access_codes').select('note, email')
  const generic = (codes ?? []).filter(c => c.note === 'generic').length
  const claimed = (codes ?? []).filter(c => c.note !== 'generic' && c.email).length
  const unclaimed = (codes ?? []).filter(c => c.note !== 'generic' && !c.email).length

  // 11. Persona counts
  const personaCounts: Record<string, number> = {}
  for (const s of sessions) personaCounts[s.persona] = (personaCounts[s.persona] ?? 0) + 1

  // 12. Recent feedback
  const { data: feedbackData } = await admin
    .from('feedback')
    .select('rating, comment, email, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    totalSignups: totalSignups ?? 0,
    haveAccess: haveAccess ?? 0,
    activated,
    generatedPunchlist,
    returned,
    activationRate,
    retentionRate,
    totalSessions: sessions.length,
    recentSessions: enriched,
    betaRequests: betaRequests ?? 0,
    codes: { generic, claimed, unclaimed },
    personaCounts,
    feedback: feedbackData ?? [],
  }
}

export default async function AdminPage({ searchParams }: { searchParams: { key?: string } }) {
  // Simple password protection via query param — works regardless of session middleware
  const secret = process.env.ADMIN_SECRET
  if (!secret || searchParams.key !== secret) {
    redirect('/')
  }

  let m
  try {
    m = await getMetrics()
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

      </div>
    </main>
  )
}
