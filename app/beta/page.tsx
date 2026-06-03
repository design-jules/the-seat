'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Answer = {
  persona_hit_hardest: string
  after_action: string
  realness: number | null
  improvement: string
  would_recommend: string
  email: string
}

const empty: Answer = {
  persona_hit_hardest: '',
  after_action: '',
  realness: null,
  improvement: '',
  would_recommend: '',
  email: '',
}

export default function BetaPage() {
  const [answers, setAnswers] = useState<Answer>(empty)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof Answer, val: string | number) =>
    setAnswers(prev => ({ ...prev, [key]: val }))

  const ready =
    answers.persona_hit_hardest &&
    answers.after_action &&
    answers.realness !== null &&
    answers.would_recommend

  async function handleSubmit() {
    if (!ready) return
    setSubmitting(true)
    const supabase = createClient()
    await supabase.from('beta_survey').insert({
      email: answers.email.trim() || null,
      persona_hit_hardest: answers.persona_hit_hardest,
      after_action: answers.after_action,
      realness: answers.realness,
      improvement: answers.improvement.trim() || null,
      would_recommend: answers.would_recommend,
    })
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <main style={{ minHeight: '100vh', background: '#023B28', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'var(--font-inter-tight), sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '52px', marginBottom: '24px' }}>🙏</div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#FDFAF7', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            That genuinely helps.
          </h1>
          <p style={{ fontSize: '17px', color: 'rgba(253,250,247,0.6)', margin: '0 0 32px', lineHeight: 1.6 }}>
            Every answer goes directly into what we build next. You just made The Seat better.
          </p>
          <a href="/session" style={{ display: 'inline-block', background: '#149077', color: '#fff', borderRadius: '100px', padding: '14px 32px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            Run another session
          </a>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FDFAF7', fontFamily: 'var(--font-inter-tight), sans-serif' }}>

      {/* Hero */}
      <div style={{ background: '#023B28', padding: 'clamp(48px, 7vw, 80px) clamp(24px, 6vw, 80px) clamp(40px, 5vw, 64px)', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(253,250,247,0.4)', margin: '0 0 16px' }}>The Seat — Beta Feedback</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#FDFAF7', margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          You sat in the seat.<br />Now tell us what you really think.
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 300, color: 'rgba(253,250,247,0.55)', margin: 0, maxWidth: '520px', marginInline: 'auto', lineHeight: 1.6 }}>
          5 questions. No fluff. Your answers go directly into what we build next.
        </p>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '620px', margin: '0 auto', padding: 'clamp(40px, 6vw, 64px) clamp(24px, 5vw, 48px)' }}>

        {/* Q1 */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#149077', margin: '0 0 10px' }}>01</p>
          <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: '#023B28', margin: '0 0 20px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Which seat hit the hardest?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { val: 'skeptic', label: 'Dana — The Skeptic', sub: 'The one who needed convincing' },
              { val: 'slammed', label: 'Marcus — The Slammed', sub: 'The one with no time for this' },
              { val: 'hype', label: 'Bex — The Hype', sub: 'The one who loved everything (maybe too much)' },
              { val: 'all', label: 'Honestly? All three got me.', sub: '' },
            ].map(({ val, label, sub }) => (
              <button
                key={val}
                onClick={() => set('persona_hit_hardest', val)}
                style={{
                  textAlign: 'left', padding: '16px 20px', borderRadius: '12px', cursor: 'pointer',
                  border: `2px solid ${answers.persona_hit_hardest === val ? '#023B28' : 'rgba(2,59,40,0.1)'}`,
                  background: answers.persona_hit_hardest === val ? '#023B28' : '#fff',
                  transition: 'all 0.15s ease',
                }}
              >
                <p style={{ fontSize: '15px', fontWeight: 700, color: answers.persona_hit_hardest === val ? '#FDFAF7' : '#023B28', margin: sub ? '0 0 2px' : 0 }}>{label}</p>
                {sub && <p style={{ fontSize: '13px', color: answers.persona_hit_hardest === val ? 'rgba(253,250,247,0.55)' : 'rgba(2,59,40,0.45)', margin: 0 }}>{sub}</p>}
              </button>
            ))}
          </div>
        </div>

        {/* Q2 */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#149077', margin: '0 0 10px' }}>02</p>
          <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: '#023B28', margin: '0 0 20px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            What happened after you got your punch list?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { val: 'fixed', label: 'Started fixing things immediately' },
              { val: 'shared', label: 'Forwarded it to someone on my team' },
              { val: 'thinking', label: "Still sitting with it — I need to think" },
              { val: 'alot', label: 'Needed a minute. It was a lot.' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => set('after_action', val)}
                style={{
                  textAlign: 'left', padding: '16px 20px', borderRadius: '12px', cursor: 'pointer',
                  border: `2px solid ${answers.after_action === val ? '#023B28' : 'rgba(2,59,40,0.1)'}`,
                  background: answers.after_action === val ? '#023B28' : '#fff',
                  transition: 'all 0.15s ease',
                }}
              >
                <p style={{ fontSize: '15px', fontWeight: 700, color: answers.after_action === val ? '#FDFAF7' : '#023B28', margin: 0 }}>{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Q3 */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#149077', margin: '0 0 10px' }}>03</p>
          <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: '#023B28', margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            How real did the feedback feel?
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(2,59,40,0.45)', margin: '0 0 20px' }}>Like, did it actually sound like a real learner?</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { val: 1, emoji: '😐', label: 'Felt a little scripted' },
              { val: 2, emoji: '😊', label: 'Pretty believable' },
              { val: 3, emoji: '🤩', label: 'Uncomfortably accurate' },
            ].map(({ val, emoji, label }) => (
              <button
                key={val}
                onClick={() => set('realness', val)}
                style={{
                  flex: 1, padding: '20px 12px', borderRadius: '14px', cursor: 'pointer',
                  border: `2px solid ${answers.realness === val ? '#023B28' : 'rgba(2,59,40,0.1)'}`,
                  background: answers.realness === val ? '#023B28' : '#fff',
                  transition: 'all 0.15s ease', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{emoji}</div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: answers.realness === val ? 'rgba(253,250,247,0.8)' : 'rgba(2,59,40,0.55)', margin: 0, lineHeight: 1.3 }}>{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Q4 */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#149077', margin: '0 0 10px' }}>04</p>
          <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: '#023B28', margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            What would make you use this every single time?
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(2,59,40,0.45)', margin: '0 0 16px' }}>Optional — but seriously, we want to know.</p>
          <textarea
            value={answers.improvement}
            onChange={e => set('improvement', e.target.value)}
            placeholder="Tell us exactly what's missing, broken, or would make this a no-brainer..."
            rows={4}
            style={{
              width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid rgba(2,59,40,0.1)',
              fontFamily: 'var(--font-inter-tight), sans-serif', fontSize: '15px', color: '#023B28',
              background: '#fff', resize: 'vertical', boxSizing: 'border-box',
              outline: 'none', lineHeight: 1.5,
            }}
          />
        </div>

        {/* Q5 */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#149077', margin: '0 0 10px' }}>05</p>
          <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: '#023B28', margin: '0 0 20px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Would you recommend The Seat to another L&D person?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { val: 'already', label: 'Already did', sub: 'Sent it to someone before finishing this survey' },
              { val: 'yes', label: 'Yes, absolutely', sub: '' },
              { val: 'probably', label: 'Probably', sub: 'Just need to use it a bit more' },
              { val: 'later', label: 'Ask me again after I try it more', sub: '' },
            ].map(({ val, label, sub }) => (
              <button
                key={val}
                onClick={() => set('would_recommend', val)}
                style={{
                  textAlign: 'left', padding: '16px 20px', borderRadius: '12px', cursor: 'pointer',
                  border: `2px solid ${answers.would_recommend === val ? '#023B28' : 'rgba(2,59,40,0.1)'}`,
                  background: answers.would_recommend === val ? '#023B28' : '#fff',
                  transition: 'all 0.15s ease',
                }}
              >
                <p style={{ fontSize: '15px', fontWeight: 700, color: answers.would_recommend === val ? '#FDFAF7' : '#023B28', margin: sub ? '0 0 2px' : 0 }}>{label}</p>
                {sub && <p style={{ fontSize: '13px', color: answers.would_recommend === val ? 'rgba(253,250,247,0.55)' : 'rgba(2,59,40,0.45)', margin: 0 }}>{sub}</p>}
              </button>
            ))}
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '40px', padding: '24px', background: 'rgba(2,59,40,0.04)', borderRadius: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#023B28', margin: '0 0 4px' }}>Want us to follow up?</p>
          <p style={{ fontSize: '13px', color: 'rgba(2,59,40,0.5)', margin: '0 0 12px' }}>Totally optional. We might reach out to ask more.</p>
          <input
            type="email"
            placeholder="your@email.com"
            value={answers.email}
            onChange={e => set('email', e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '10px', border: '2px solid rgba(2,59,40,0.1)',
              fontFamily: 'var(--font-inter-tight), sans-serif', fontSize: '14px', color: '#023B28',
              background: '#fff', boxSizing: 'border-box', outline: 'none',
            }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!ready || submitting}
          style={{
            width: '100%', padding: '18px', borderRadius: '100px', border: 'none', cursor: ready ? 'pointer' : 'not-allowed',
            background: ready ? '#023B28' : 'rgba(2,59,40,0.15)',
            color: ready ? '#FDFAF7' : 'rgba(2,59,40,0.35)',
            fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-inter-tight), sans-serif',
            letterSpacing: '-0.01em', transition: 'all 0.2s ease',
          }}
        >
          {submitting ? 'Sending...' : 'Send my feedback'}
        </button>

        {!ready && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(2,59,40,0.35)', margin: '12px 0 0' }}>
            Answer questions 1, 2, 3, and 5 to submit
          </p>
        )}

      </div>
    </main>
  )
}
