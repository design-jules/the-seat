'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AccessPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [codeLoading, setCodeLoading] = useState(false)
  const [payLoading, setPayLoading] = useState(false)

  const handlePay = async () => {
    setPayLoading(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: window.location.origin }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setPayLoading(false)
    }
  }

  const handleCode = async () => {
    if (!code.trim()) return
    setCodeLoading(true)
    setCodeError(null)
    try {
      const res = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (data.valid) {
        sessionStorage.setItem('the-seat-access', 'code')
        router.push('/session')
      } else {
        setCodeError(data.message || 'Invalid code. Try again.')
        setCodeLoading(false)
      }
    } catch {
      setCodeError('Something went wrong. Try again.')
      setCodeLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FDFAF7',
      fontFamily: 'var(--font-inter-tight), sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#149077', marginBottom: '16px' }}>
            Beta Access
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: '#023B28', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '16px' }}>
            Ready to take a seat?
          </h1>
          <p style={{ fontSize: '17px', fontWeight: 300, color: 'rgba(2,59,40,0.6)', lineHeight: 1.6, margin: 0 }}>
            The Seat is in beta. Get instant access for $19, or enter your beta code below.
          </p>
        </div>

        {/* Pay option */}
        <div style={{
          backgroundColor: '#023B28',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            One session
          </div>
          <div style={{ fontSize: '52px', fontWeight: 800, color: '#FDFAF7', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '8px' }}>
            $19
          </div>
          <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(255,255,255,0.55)', marginBottom: '24px', lineHeight: 1.5 }}>
            Upload your training, pick a seat, get your punch list.
          </p>
          <button
            onClick={handlePay}
            disabled={payLoading}
            style={{
              backgroundColor: '#149077',
              color: '#fff',
              border: 'none',
              borderRadius: '100px',
              padding: '14px 36px',
              fontSize: '16px',
              fontWeight: 800,
              fontFamily: 'var(--font-inter-tight), sans-serif',
              cursor: payLoading ? 'not-allowed' : 'pointer',
              width: '100%',
              transition: 'background 0.2s ease',
              opacity: payLoading ? 0.7 : 1,
            }}
          >
            {payLoading ? 'Redirecting to Stripe...' : 'Get access — $19 →'}
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(2,59,40,0.1)' }} />
          <span style={{ fontSize: '13px', color: 'rgba(2,59,40,0.35)', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(2,59,40,0.1)' }} />
        </div>

        {/* Code option */}
        <div style={{
          backgroundColor: '#fff',
          border: '2px solid rgba(2,59,40,0.1)',
          borderRadius: '20px',
          padding: '28px',
        }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#023B28', margin: '0 0 14px', letterSpacing: '-0.01em' }}>
            Got a beta code?
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleCode()}
              placeholder="ENTER CODE"
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '100px',
                border: `2px solid ${codeError ? '#fca5a5' : 'rgba(2,59,40,0.15)'}`,
                backgroundColor: '#FDFAF7',
                fontSize: '15px',
                fontFamily: 'var(--font-inter-tight), sans-serif',
                fontWeight: 700,
                color: '#023B28',
                letterSpacing: '0.08em',
                outline: 'none',
              }}
            />
            <button
              onClick={handleCode}
              disabled={codeLoading || !code.trim()}
              style={{
                backgroundColor: code.trim() ? '#023B28' : 'rgba(2,59,40,0.15)',
                color: code.trim() ? '#fff' : 'rgba(2,59,40,0.3)',
                border: 'none',
                borderRadius: '100px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: 'var(--font-inter-tight), sans-serif',
                cursor: code.trim() && !codeLoading ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {codeLoading ? '...' : 'Go →'}
            </button>
          </div>
          {codeError && (
            <p style={{ fontSize: '13px', color: '#dc2626', margin: '10px 0 0', fontWeight: 500 }}>
              {codeError}
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
