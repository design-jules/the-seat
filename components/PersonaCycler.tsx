'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const PERSONAS = [
  {
    id: 'skeptic',
    label: 'the skeptic',
    image: '/the_skeptic2.png',
    accent: '#2a3d30',
    accentText: '#FDFAF7',
    quote: 'Why is this worth my time at all?',
  },
  {
    id: 'hype',
    label: 'the hype',
    image: '/the_hype2.png',
    accent: '#149077',
    accentText: '#fff',
    quote: 'Fun class — but now what?',
  },
  {
    id: 'slammed',
    label: 'the slammed',
    image: '/the_slammed2.png',
    accent: '#6b3a8a',
    accentText: '#fff',
    quote: "I'm too busy to be here.",
  },
]

export default function PersonaCycler() {
  const [current, setCurrent] = useState(0)
  const pausedRef = useRef(false)

  useEffect(() => {
    const t = setInterval(() => {
      if (!pausedRef.current) setCurrent(p => (p + 1) % 3)
    }, 4200)
    return () => clearInterval(t)
  }, [])

  const getPos = (i: number) => {
    const rel = (i - current + 3) % 3
    if (rel === 0) return 'active'
    if (rel === 1) return 'next'
    return 'prev'
  }

  return (
    <div className="cycler-section">

      {/* Stage — cards absolutely positioned inside */}
      <div
        className="cycler-stage"
        onMouseEnter={() => { pausedRef.current = true }}
        onMouseLeave={() => { pausedRef.current = false }}
      >
        {PERSONAS.map((p, i) => {
          const pos = getPos(i)
          const isActive = pos === 'active'
          return (
            <div
              key={p.id}
              className="cycler-card"
              data-pos={pos}
              onClick={() => !isActive && setCurrent(i)}
              aria-label={isActive ? undefined : `View ${p.label}`}
            >
              {/* Speech bubble */}
              <div
                className="cycler-card-bubble"
                style={{ background: p.accent, color: p.accentText }}
              >
                &ldquo;{p.quote}&rdquo;
                <div className="cycler-bubble-tail" style={{ background: p.accent }} />
              </div>

              <div className="cycler-card-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.label} style={{ mixBlendMode: 'multiply' }} />
              </div>
              <div
                className="cycler-card-pill"
                style={{ background: p.accent, color: p.accentText }}
              >
                {p.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dot nav */}
      <div className="cycler-dots">
        {PERSONAS.map((_, i) => (
          <button
            key={i}
            className={`cycler-dot${i === current ? ' cycler-dot-on' : ''}`}
            style={{ background: i === current ? PERSONAS[i].accent : 'rgba(2,59,40,0.18)' }}
            onClick={() => setCurrent(i)}
            aria-label={`View ${PERSONAS[i].label}`}
          />
        ))}
      </div>

      <div className="cycler-cta">
        <Link href="/session" className="btn-primary" style={{ fontSize: '16px', padding: '14px 36px' }}>
          Take a Seat
        </Link>
      </div>

    </div>
  )
}
