import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getMetrics() {
  const admin = createAdminClient()

  // 1. Total signups (auth.users)
  const { count: totalSignups } = await admin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .schema('auth')

  // 2. Have access (approved_users)
  const { count: haveAccess } = await admin
    .from('approved_users')
    .select('*', { count: 'exact', head: true })

  // 3. Activated — approved users who have at least one session
  const { data: activatedData } = await admin
    .from('sessions')
    .select('user_id')
    .not('user_id', 'is', null)
  const activatedUserIds = new Set((activatedData ?? []).map(r => r.user_id))

  const { data: approvedData } = await admin
    .from('approved_users')
    .select('user_id')
  const approvedUserIds = new Set((approvedData ?? []).map(r => r.user_id))

  let activated = 0
  for (const id of activatedUserIds) {
    if (approvedUserIds.has(id)) activated++
  }

  // 4. Generated punch list
  const { data: punchlistSessions } = await admin
    .from('punch_list_items')
    .select('session_id')
  const punchlistSessionIds = new Set((punchlistSessions ?? []).map(r => r.session_id))

  const { data: punchlistSessionData } = await admin
    .from('sessions')
    .select('user_id')
    .in('id', [...punchlistSessionIds])
    .not('user_id', 'is', null)
  const punchlistUserIds = new Set((punchlistSessionData ?? []).map(r => r.user_id))
  let generatedPunchlist = 0
  for (const id of punchlistUserIds) {
    if (approvedUserIds.has(id)) generatedPunchlist++
  }

  // 5. Returned (2+ sessions)
  const { data: allSessions } = await admin
    .from('sessions')
    .select('user_id')
    .not('user_id', 'is', null)
  const sessionCountByUser: Record<string, number> = {}
  for (const s of (allSessions ?? [])) {
    sessionCountByUser[s.user_id] = (sessionCountByUser[s.user_id] ?? 0) + 1
  }
  const returned = Object.values(sessionCountByUser).filter(c => c >= 2).length

  // 6. Activation rate
  const activationRate = haveAccess && haveAccess > 0
    ? Math.round((activated / haveAccess) * 100)
    : 0

  // 7. Retention rate (returned within 14 days of first session)
  const { data: sessionDates } = await admin
    .from('sessions')
    .select('user_id, created_at')
    .not('user_id', 'is', null)
    .order('created_at', { ascending: true })

  const firstSessionByUser: Record<string, Date> = {}
  const returnedWithin14: Set<string> = new Set()
  for (const s of (sessionDates ?? [])) {
    const d = new Date(s.created_at)
    if (!firstSessionByUser[s.user_id]) {
      firstSessionByUser[s.user_id] = d
    } else {
      const diff = d.getTime() - firstSessionByUser[s.user_id].getTime()
      if (diff <= 14 * 24 * 60 * 60 * 1000) returnedWithin14.add(s.user_id)
    }
  }
  const uniqueFirstSessionUsers = Object.keys(firstSessionByUser).length
  const retentionRate = uniqueFirstSessionUsers > 0
    ? Math.round((returnedWithin14.size / uniqueFirstSessionUsers) * 100)
    : 0

  // Recent sessions
  const { data: recentSessions } = await admin
    .from('sessions')
    .select('id, created_at, persona, training_title, user_id')
    .order('created_at', { ascending: false })
    .limit(10)

  // Enrich recent sessions with email + punchlist flag
  const enriched = await Promise.all((recentSessions ?? []).map(async s => {
    let email = 'anonymous'
    if (s.user_id) {
      const { data: u } = await admin.from('users').select('email').eq('id', s.user_id).single().schema('auth')
      email = u?.email ?? 'unknown'
    }
    const hasPunchlist = punchlistSessionIds.has(s.id)
    return { ...s, email, hasPunchlist }
  }))

  // Beta requests waiting
  const { count: betaRequests } = await admin
    .from('beta_requests')
    .select('*', { count: 'exact', head: true })

  // Codes summary
  const { data: codes } = await admin.from('access_codes').select('note, email')
  const generic = (codes ?? []).filter(c => c.note === 'generic').length
  const claimed = (codes ?? []).filter(c => c.note !== 'generic' && c.email).length
  const unclaimed = (codes ?? []).filter(c => c.note !== 'generic' && !c.email).length

  // Persona breakdown
  const { data: personaData } = await admin.from('sessions').select('persona')
  const personaCounts: Record<string, number> = {}
  for (const s of (personaData ?? [])) {
    personaCounts[s.persona] = (personaCounts[s.persona] ?? 0) + 1
  }

  return {
    totalSignups: totalSignups ?? 0,
    haveAccess: haveAccess ?? 0,
    activated,
    generatedPunchlist,
    returned,
    activationRate,
    retentionRate,
    recentSessions: enriched,
    betaRequests: betaRequests ?? 0,
    codes: { generic, claimed, unclaimed },
    personaCounts,
    totalSessions: allSessions?.length ?? 0,
  }
}

export default async function AdminPage() {
  // Auth check — Julie only
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'jules.kirkham@gmail.com') {
    redirect('/')
  }

  const m = await getMetrics()
  const now = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' })

  const personaLabel: Record<string, string> = { skeptic: 'Dana', slammed: 'Marcus', hype: 'Bex' }

  return (
    <main style={{ minHeight: '100vh', background: '#F4F1EC', padding: '40px 24px', fontFamily: 'var(--font-inter-tight), sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.45)', margin: '0 0 6px' }}>The Seat</p>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#023B28', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Beta Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'rgba(2,59,40,0.4)', margin: 0 }}>Last loaded: {now} PT</p>
        </div>

        {/* 6 key metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Have Access', value: m.haveAccess, sub: `${m.totalSignups} total signups` },
            { label: 'Activated', value: m.activated, sub: 'ran ≥ 1 session' },
            { label: 'Punch Lists', value: m.generatedPunchlist, sub: `${m.totalSessions} total sessions` },
            { label: 'Returned', value: m.returned, sub: 'ran ≥ 2 sessions' },
            { label: 'Activation Rate', value: `${m.activationRate}%`, sub: 'activated / have access' },
            { label: 'Retention Rate', value: `${m.retentionRate}%`, sub: 'returned within 14 days' },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(2,59,40,0.08)' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', margin: '0 0 8px' }}>{label}</p>
              <p style={{ fontSize: '36px', fontWeight: 800, color: '#023B28', margin: '0 0 4px', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: '12px', color: 'rgba(2,59,40,0.4)', margin: 0 }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Persona breakdown + codes side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(2,59,40,0.08)' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', margin: '0 0 16px' }}>Persona Sessions</p>
            {['skeptic', 'slammed', 'hype'].map(p => (
              <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#023B28' }}>{personaLabel[p]} ({p})</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#149077' }}>{m.personaCounts[p] ?? 0}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(2,59,40,0.08)' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', margin: '0 0 16px' }}>Access Codes + Requests</p>
            {[
              { label: 'Generic (reusable)', value: m.codes.generic },
              { label: 'Claimed (account-tied)', value: m.codes.claimed },
              { label: 'Unclaimed', value: m.codes.unclaimed },
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
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(2,59,40,0.08)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', margin: '0 0 16px' }}>Recent Sessions</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['Date', 'Persona', 'User', 'Training', 'Punch List?'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontWeight: 700, color: 'rgba(2,59,40,0.45)', paddingBottom: '10px', borderBottom: '1px solid rgba(2,59,40,0.08)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.recentSessions.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < m.recentSessions.length - 1 ? '1px solid rgba(2,59,40,0.06)' : 'none' }}>
                  <td style={{ padding: '10px 0', color: 'rgba(2,59,40,0.6)' }}>{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td style={{ padding: '10px 0', fontWeight: 600, color: '#023B28' }}>{personaLabel[s.persona] ?? s.persona}</td>
                  <td style={{ padding: '10px 0', color: 'rgba(2,59,40,0.6)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</td>
                  <td style={{ padding: '10px 0', color: 'rgba(2,59,40,0.5)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.training_title || '—'}</td>
                  <td style={{ padding: '10px 0' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: s.hasPunchlist ? '#149077' : 'rgba(2,59,40,0.08)', color: s.hasPunchlist ? '#fff' : 'rgba(2,59,40,0.4)' }}>
                      {s.hasPunchlist ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  )
}
