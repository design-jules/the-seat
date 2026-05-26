'use client'

const items = [
  'honest learner feedback',
  'The Skeptic',
  'The Slammed',
  'The Hype',
  'stop guessing',
  'design from the back of the room',
  'real reactions — before day one',
  'what do they actually think',
  'training that actually lands',
  'find out before you\'re in the room',
]

export default function Ticker() {
  const doubled = [...items, ...items]
  return (
    <div className="ticker-wrap" aria-hidden="true">
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <span key={i} className="ticker-item">
            {item}
            <span className="ticker-sep">●</span>
          </span>
        ))}
      </div>
    </div>
  )
}
