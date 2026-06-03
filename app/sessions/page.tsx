'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Session = {
  id: string
  persona: string
  training_title: string | null
  created_at: string
  item_count: number
}

const personaLabel: Record<string, string> = {
  skeptic: 'Dana — The Skeptic',
  slammed: 'Marcus — The Slammed',
  hype: 'Bex — The Hype',
}

const personaColor: Record<string, string> = {
  skeptic: '#023B28',
  slammed: '#149077',
  hype: '#8a3fad',
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoggedIn(false)
        setLoading(false)
        return
      }
      setLoggedIn(true)

      const { data: sessionData } = await supabase
        .from('sessions')
        .select('id, persona, training_title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      const sessionList = sessionData ?? []

      // Fetch punch list item counts for each session
      const ids = sessionList.map(s => s.id)
      const countMap: Record<string, number> = {}
      if (ids.length > 0) {
        const { data: items } = await supabase
          .from('punch_list_items')
          .select('session_id')
          .in('session_id', ids)
        for (const item of (items ?? [])) {
          countMap[item.session_id] = (countMap[item.session_id] ?? 0) + 1
        }
      }

      setSessions(sessionList.map(s => ({ ...s, item_count: countMap[s.id] ?? 0 })))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#F4F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-inter-tight), sans-serif' }}>
        <p style={{ color: 'rgba(2,59,40,0.4)', fontSize: '15px' }}>Loading...</p>
      </main>
    )
  }

  if (!loggedIn) {
    return (
      <main style={{ minHeight: '100vh', background: '#F4F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-inter-tight), sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '0 24px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.4)', marginBottom: '12px' }}>My Sessions</p>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#023B28', marginBottom: '12px', letterSpacing: '-0.02em' }}>Sign in to see your history</h1>
          <p style={{ fontSize: '15px', color: 'rgba(2,59,40,0.55)', marginBottom: '28px', lineHeight: 1.5 }}>Your past sessions are tied to your account.</p>
          <Link href="/session" style={{ display: 'inline-block', background: '#023B28', color: '#fff', borderRadius: '100px', padding: '14px 32px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            Go to app
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F4F1EC', padding: '40px 24px', fontFamily: 'var(--font-inter-tight), sans-serif' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(2,59,40,0.45)', margin: '0 0 6px' }}>The Seat</p>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#023B28', margin: '0 0 4px', letterSpacing: '-0.02em' }}>My Sessions</h1>
          <p style={{ fontSize: '13px', color: 'rgba(2,59,40,0.4)', margin: 0 }}>{sessions.length} session{sessions.length !== 1 ? 's' : ''} total</p>
        </div>

        {sessions.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '40px 24px', border: '1px solid rgba(2,59,40,0.08)', textAlign: 'center' }}>
            <p style={{ fontSize: '15px', color: 'rgba(2,59,40,0.5)', margin: '0 0 20px' }}>No sessions yet. Run your first one!</p>
            <Link href="/session" style={{ display: 'inline-block', background: '#023B28', color: '#fff', borderRadius: '100px', padding: '14px 32px', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
              Take a Seat
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sessions.map(s => (
              <div key={s.id} style={{ background: '#fff', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(2,59,40,0.08)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: personaColor[s.persona] ?? '#149077', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#023B28', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.training_title || 'Untitled training'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'rgba(2,59,40,0.5)', margin: 0 }}>
                    {personaLabel[s.persona] ?? s.persona}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '12px', color: 'rgba(2,59,40,0.4)', margin: '0 0 2px' }}>
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {s.item_count > 0 && (
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#149077', margin: 0 }}>
                      {s.item_count} punch list items
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'center', paddingTop: '16px' }}>
              <Link href="/session" style={{ display: 'inline-block', background: '#023B28', color: '#fff', borderRadius: '100px', padding: '14px 32px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em' }}>
                Start a new session
              </Link>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
