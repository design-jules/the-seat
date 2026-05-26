'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const PERSONAS = [
  {
    id: 'skeptic',
    label: 'the skeptic',
    image: '/the_skeptic2.png',
    bg: '#F0EBE1',
    accent: '#2a3d30',
    accentText: '#FDFAF7',
    quote: 'Why is this worth my time at all?',
  },
  {
    id: 'hype',
    label: 'the hype',
    image: '/the_hype2.png',
    bg: '#D8EDE9',
    accent: '#149077',
    accentText: '#fff',
    quote: 'Wow that was such a fun class, but no idea what to do now.',
  },
  {
    id: 'slammed',
    label: 'the slammed',
    image: '/the_slammed2.png',
    bg: '#E3CFDF',
    accent: '#6b3a8a',
    accentText: '#fff',
    quote: "I'm too busy to be here.",
  },
]

export default function PersonaCycler() {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  const goTo = useCallback((to: number | 'next') => {
    setFading(true)
    setTimeout(() => {
      setCurrent(prev => {
        if (to === 'next') return (prev + 1) % 3
        return to
      })
      setFading(false)
    }, 260)
  }, [])

  useEffect(() => {
    const t = setInterval(() => goTo('next'), 4200)
    return () => clearInterval(t)
  }, [goTo])

  const p = PERSONAS[current]

  return (
    <div
      className="cycler-wrap"
      style={{ backgroundColor: p.bg, transition: 'background-color 0.55s ease' }}
    >
      <div className={`cycler-inner ${fading ? 'cycler-fading' : ''}`}>

        {/* Image */}
        <div className="cycler-img-col">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image}
            alt={p.label}
            className="cycler-img"
            style={{ mixBlendMode: 'multiply' }}
          />
        </div>

        {/* Text */}
        <div className="cycler-text-col">
          <div
            className="cycler-label"
            style={{ background: p.accent, color: p.accentText }}
          >
            {p.label}
          </div>
          <blockquote className="cycler-quote">
            &ldquo;{p.quote}&rdquo;
          </blockquote>

          {/* Dots */}
          <div className="cycler-dots">
            {PERSONAS.map((persona, i) => (
              <button
                key={persona.id}
                className={`cycler-dot${i === current ? ' cycler-dot-on' : ''}`}
                style={{ background: i === current ? p.accent : 'rgba(2,59,40,0.18)' }}
                onClick={() => goTo(i)}
                aria-label={`View ${persona.label}`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* CTA */}
      <div className="cycler-cta">
        <Link href="/session" className="btn-primary" style={{ fontSize: '16px', padding: '14px 36px' }}>
          Take a Seat
        </Link>
        <p className="cycler-hint">tap card to cycle through · or just pick one</p>
      </div>

    </div>
  )
}
