'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Phase = 'upload' | 'scanning' | 'results' | 'chat' | 'punchlist'
type Persona = 'skeptic' | 'slammed' | 'hype'

interface QuickScanResults {
  skeptic: string
  slammed: string
  hype: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  isCoachMode?: boolean
}

interface PunchListItem {
  number: number
  title: string
  detail: string
  priority: 'DO FIRST' | 'DO NEXT' | 'NICE TO HAVE'
}

const PRIORITY_CONFIG = {
  'DO FIRST':     { bg: '#023B28', text: '#FDFAF7' },
  'DO NEXT':      { bg: '#149077', text: '#FDFAF7' },
  'NICE TO HAVE': { bg: '#EBD6E9', text: '#023B28' },
}

const PERSONA_CONFIG = {
  skeptic: {
    name: 'The Skeptic',
    personaName: 'Dana',
    bg: '#f5f0ea',
    image: '/the_skeptic2.png',
    label: 'skeptic',
  },
  slammed: {
    name: 'The Slammed',
    personaName: 'Marcus',
    bg: '#E2F3F0',
    image: '/the_slammed2.png',
    label: 'slammed',
  },
  hype: {
    name: 'The Hype',
    personaName: 'Bex',
    bg: '#EBD6E9',
    image: '/the_hype2.png',
    label: 'hype',
  },
}

async function saveSession(persona: Persona, trainingContent: string, trainingTitle: string, confidenceBefore: number | null): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('sessions').insert({
      user_id: user?.id ?? null,
      persona,
      training_topic: trainingContent.slice(0, 100),
      training_title: trainingTitle || null,
      confidence_before: confidenceBefore,
    }).select('id').single()
    if (error) return null
    return data?.id ?? null
  } catch {
    return null
  }
}

async function saveConfidenceAfter(sessionId: string, confidence: number) {
  try {
    const supabase = createClient()
    await supabase.from('sessions').update({ confidence_after: confidence }).eq('id', sessionId)
  } catch {
    // ignore
  }
}

async function savePunchlistItems(sessionId: string, items: PunchListItem[]) {
  try {
    const supabase = createClient()
    await supabase.from('punch_list_items').insert(
      items.map((item, idx) => ({
        session_id: sessionId,
        item: item.detail,
        title: item.title,
        priority: item.priority,
        detail: item.detail,
        order_index: idx,
      }))
    )
  } catch {
    // ignore errors
  }
}

export default function SessionPage() {
  const [phase, setPhase] = useState<Phase>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [trainingContent, setTrainingContent] = useState('')
  const [quickScanResults, setQuickScanResults] = useState<QuickScanResults | null>(null)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [exchangeCount, setExchangeCount] = useState(0)
  const [scanError, setScanError] = useState<string | null>(null)
  const [punchlistItems, setPunchlistItems] = useState<PunchListItem[] | null>(null)
  const [punchlistError, setPunchlistError] = useState<string | null>(null)
  const [trainingTitle, setTrainingTitle] = useState<string>('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [confidenceBefore, setConfidenceBefore] = useState<number | null>(null)
  const [confidenceAfter, setConfidenceAfter] = useState<number | null>(null)
  const [confidenceAfterSaved, setConfidenceAfterSaved] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInitialized = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Prevent browser from opening dragged files as a new page
  useEffect(() => {
    const prevent = (e: DragEvent) => { e.preventDefault() }
    document.addEventListener('dragover', prevent)
    document.addEventListener('drop', prevent)
    return () => {
      document.removeEventListener('dragover', prevent)
      document.removeEventListener('drop', prevent)
    }
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // only clear if leaving the zone entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setUploadedFile(file)
      setTrainingTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setTrainingTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const canProceed = uploadedFile !== null || pastedText.trim().length > 0

  const handleScan = async () => {
    setScanError(null)
    setPhase('scanning')

    let content = ''

    if (uploadedFile) {
      try {
        const formData = new FormData()
        formData.append('file', uploadedFile)
        const res = await fetch('/api/extract-text', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        content = data.text
      } catch (err) {
        setScanError(err instanceof Error ? err.message : 'Failed to extract text from file.')
        setPhase('upload')
        return
      }
    }

    if (pastedText.trim()) {
      content = content ? `${content}\n\n${pastedText}` : pastedText
    }

    setTrainingContent(content)

    try {
      const res = await fetch('/api/quick-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingContent: content }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setQuickScanResults(data)
      setPhase('results')
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Failed to analyze training content.')
      setPhase('upload')
    }
  }

  const handlePersonaSelect = async (persona: Persona, skipToList = false) => {
    setSelectedPersona(persona)
    chatInitialized.current = false
    const id = await saveSession(persona, trainingContent, trainingTitle, confidenceBefore)
    setSessionId(id)
    if (skipToList) {
      setPunchlistItems(null)
      setPunchlistError(null)
      setPhase('punchlist')
      try {
        const res = await fetch('/api/punch-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [], persona, trainingContent }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setPunchlistItems(data.items)
        if (id && data.items?.length) savePunchlistItems(id, data.items)
      } catch {
        setPunchlistError('Something went wrong. Please try again.')
      }
    } else {
      setPhase('chat')
    }
  }

  const streamMessage = useCallback(async (msgs: Message[], count: number, persona: Persona, content: string) => {
    setIsStreaming(true)
    const assistantMessage: Message = { role: 'assistant', content: '', isCoachMode: false }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: msgs.map(m => ({ role: m.role, content: m.content })),
          persona,
          trainingContent: content,
          exchangeCount: count,
        }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let isCoachMode = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                fullText += parsed.text
                // Check for coach mode prefix
                if (fullText.startsWith('[COACH MODE]')) {
                  isCoachMode = true
                }
                const displayText = isCoachMode ? fullText.replace(/^\[COACH MODE\]\s*/, '') : fullText
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: displayText,
                    isCoachMode,
                  }
                  return updated
                })
              }
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: "Sorry, something went wrong. Try again.",
          isCoachMode: false,
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }, [])

  // Trigger initial message when chat phase begins
  useEffect(() => {
    if (phase === 'chat' && selectedPersona && !chatInitialized.current) {
      chatInitialized.current = true
      streamMessage([], 0, selectedPersona, trainingContent)
    }
  }, [phase, selectedPersona, trainingContent, streamMessage])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming || !selectedPersona) return

    const userMessage: Message = { role: 'user', content: inputValue.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')

    const newExchangeCount = exchangeCount + 1
    setExchangeCount(newExchangeCount)

    await streamMessage(
      newMessages,
      newExchangeCount,
      selectedPersona,
      trainingContent
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleGetPunchlist = async () => {
    setPunchlistItems(null)
    setPunchlistError(null)
    setPhase('punchlist')
    try {
      const res = await fetch('/api/punch-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          persona: selectedPersona,
          trainingContent,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPunchlistItems(data.items)
      if (sessionId && data.items?.length) {
        savePunchlistItems(sessionId, data.items)
      }
    } catch {
      setPunchlistError('Something went wrong generating your punch list. Please try again.')
    }
  }

  if (phase === 'upload') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FDFAF7', fontFamily: 'var(--font-inter-tight), Inter Tight, sans-serif' }}>
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes floatBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
          .upload-zone-label:hover .upload-zone-inner { border-color: #023B28; box-shadow: 0 0 0 6px rgba(20,144,119,0.15), 0 12px 40px rgba(2,59,40,0.1); background: #f0faf7; }
          .upload-zone-label:hover .upload-zone-icon { animation: floatBob 1s ease-in-out infinite; }
          .persona-peek:hover { transform: translateY(-4px) scale(1.03); }
        `}</style>

        {/* Hero headline */}
        <div style={{ textAlign: 'center', padding: 'clamp(48px, 7vw, 80px) clamp(24px, 5vw, 60px) 0', animation: 'fadeUp 0.5s ease both' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#149077', marginBottom: '16px' }}>
            The Seat — Quick Scan
          </p>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, color: '#023B28', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '20px' }}>
            Drop your training.<br />We&rsquo;ll tell you the truth.
          </h1>
          <p style={{ fontSize: 'clamp(17px, 2vw, 21px)', fontWeight: 300, color: 'rgba(2,59,40,0.6)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Upload your slides, facilitator notes, handouts, or session outline. We&rsquo;ll run it through The Seat and show you exactly what three very different learners are thinking.
          </p>
        </div>

        {/* How it works strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', padding: 'clamp(36px, 5vw, 56px) clamp(24px, 5vw, 60px)', flexWrap: 'wrap', animation: 'fadeUp 0.5s 0.1s ease both' }}>
          {[
            { icon: '📂', label: 'Upload your training', sub: 'Slides, notes, handouts — whatever you\'ve got' },
            { icon: '⚙️', label: 'The Seat engine reads it', sub: 'We extract what\'s actually in there' },
            { icon: '💬', label: 'Three learners react', sub: 'Honest, specific, a little uncomfortable' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              <div style={{ textAlign: 'center', padding: '0 24px', minWidth: '180px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{step.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#023B28', marginBottom: '4px' }}>{step.label}</div>
                <div style={{ fontSize: '13px', color: 'rgba(2,59,40,0.5)', lineHeight: 1.4 }}>{step.sub}</div>
              </div>
              {i < 2 && (
                <div style={{ color: '#149077', fontSize: '22px', fontWeight: 300, opacity: 0.5, padding: '0 4px', flexShrink: 0 }}>→</div>
              )}
            </div>
          ))}
        </div>

        {/* Persona peek */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', padding: '0 24px clamp(40px, 5vw, 60px)', flexWrap: 'wrap', animation: 'fadeUp 0.5s 0.2s ease both' }}>
          {[
            { img: '/the_skeptic2.png', name: 'The Skeptic', bg: '#2a3d30', textColor: '#fff', blend: 'screen' as const },
            { img: '/the_slammed2.png', name: 'The Slammed', bg: '#E2F3F0', textColor: '#023B28', blend: 'multiply' as const },
            { img: '/the_hype2.png',    name: 'The Hype',    bg: '#EBD6E9', textColor: '#023B28', blend: 'multiply' as const },
          ].map((p) => (
            <div key={p.name} className="persona-peek" style={{ width: '160px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(2,59,40,0.1)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default' }}>
              <div style={{ backgroundColor: p.bg, height: '140px', position: 'relative', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={p.name} style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', height: '130px', mixBlendMode: p.blend, objectFit: 'contain' }} />
              </div>
              <div style={{ backgroundColor: '#fff', padding: '10px 12px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#023B28' }}>{p.name}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Upload form */}
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 clamp(24px, 5vw, 40px) 80px', animation: 'fadeUp 0.5s 0.3s ease both' }}>

          {/* PPT callout — prominent */}
          <div style={{
            background: '#FFF3E8',
            border: '1.5px solid rgba(232,145,58,0.35)',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <span style={{ fontSize: '22px', flexShrink: 0, lineHeight: 1.3 }}>📊</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '16px', color: '#023B28', margin: '0 0 4px' }}>
                Got a PowerPoint? You&rsquo;ll need to export it as a PDF first.
              </p>
              <p style={{ fontSize: '14px', color: 'rgba(2,59,40,0.6)', margin: 0, lineHeight: 1.5 }}>
                File → Export → PDF (takes about 10 seconds). Then drop it in below.
              </p>
            </div>
          </div>

          {scanError && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 20px', marginBottom: '24px', color: '#991b1b', fontSize: '15px' }}>
              {scanError}
            </div>
          )}

          {/* Hidden file input — lives outside the drop zone to avoid event loops */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'none' }}
          />

          {/* Drop zone — div with explicit click handler */}
          <div
            onClick={openFilePicker}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="upload-zone-label"
            style={{
              border: `2.5px solid ${isDragging ? '#023B28' : '#149077'}`,
              borderRadius: '20px',
              padding: '52px 40px',
              cursor: 'pointer',
              backgroundColor: isDragging ? '#f0faf7' : '#FDFAF7',
              boxShadow: isDragging
                ? '0 0 0 6px rgba(20,144,119,0.15), 0 12px 40px rgba(2,59,40,0.1)'
                : '0 2px 16px rgba(2,59,40,0.06)',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              marginBottom: '12px',
              userSelect: 'none',
            }}
          >
            {uploadedFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '36px' }}>✅</div>
                <div style={{ fontWeight: 700, color: '#023B28', fontSize: '18px' }}>{uploadedFile.name}</div>
                <div style={{ fontSize: '14px', color: '#149077', fontWeight: 600 }}>
                  Ready to go. Hit the button below.
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(2,59,40,0.4)', marginTop: '2px' }}>Click here to swap the file</div>
              </div>
            ) : isDragging ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '44px' }}>📂</div>
                <p style={{ fontWeight: 700, color: '#023B28', fontSize: '22px', margin: 0 }}>go ahead, we can take it</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div className="upload-zone-icon" style={{ fontSize: '40px' }}>⬆️</div>
                <p style={{ fontWeight: 700, color: '#023B28', fontSize: '20px', margin: 0 }}>drag it here or click to upload</p>
                <p style={{ fontSize: '15px', color: 'rgba(2,59,40,0.5)', margin: 0 }}>PDF or Word doc (.pdf, .docx)</p>
              </div>
            )}
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(2,59,40,0.35)', textAlign: 'center', marginBottom: '32px' }}>
            Your slides, facilitator notes, handouts, session outline — anything works
          </p>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(2,59,40,0.1)' }} />
            <span style={{ fontSize: '13px', color: 'rgba(2,59,40,0.35)', fontWeight: 500 }}>or paste it below</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(2,59,40,0.1)' }} />
          </div>

          {/* Textarea */}
          <textarea
            value={pastedText}
            onChange={e => setPastedText(e.target.value)}
            placeholder="Paste your slide outline, facilitator notes, session plan, handout copy — whatever you've got. Even rough notes work."
            style={{
              width: '100%',
              minHeight: '180px',
              borderRadius: '16px',
              border: '2px solid rgba(2,59,40,0.15)',
              backgroundColor: '#FDFAF7',
              padding: '18px 20px',
              fontSize: '16px',
              fontFamily: 'var(--font-inter-tight), Inter Tight, sans-serif',
              fontWeight: 300,
              color: '#023B28',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              lineHeight: 1.6,
              marginBottom: '32px',
            }}
            onFocus={e => { e.target.style.borderColor = '#149077'; e.target.style.boxShadow = '0 0 0 4px rgba(20,144,119,0.12)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(2,59,40,0.15)'; e.target.style.boxShadow = 'none' }}
          />

          {/* Confidence rating */}
          <div style={{ marginBottom: '36px', backgroundColor: 'rgba(2,59,40,0.04)', borderRadius: '16px', padding: '20px 24px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#023B28', margin: '0 0 14px', letterSpacing: '-0.01em' }}>
              Before we dig in — how confident are you in this training right now?
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  onClick={() => setConfidenceBefore(n)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                    backgroundColor: confidenceBefore === n ? '#149077' : confidenceBefore && n <= confidenceBefore ? 'rgba(20,144,119,0.15)' : 'rgba(2,59,40,0.08)',
                    color: confidenceBefore === n ? '#fff' : '#023B28',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s ease', flexShrink: 0,
                    fontFamily: 'var(--font-inter-tight), sans-serif',
                  }}
                >{n}</button>
              ))}
              <span style={{ fontSize: '12px', color: 'rgba(2,59,40,0.4)', marginLeft: '4px', whiteSpace: 'nowrap' }}>
                {confidenceBefore ? `${confidenceBefore}/10` : '1 = not at all · 10 = rock solid'}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={canProceed ? handleScan : undefined}
              style={{
                backgroundColor: canProceed ? '#149077' : 'rgba(2,59,40,0.15)',
                color: canProceed ? '#FDFAF7' : 'rgba(2,59,40,0.3)',
                fontFamily: 'var(--font-inter-tight), Inter Tight, sans-serif',
                fontWeight: 800,
                fontSize: '18px',
                padding: '18px 56px',
                borderRadius: '100px',
                border: 'none',
                cursor: canProceed ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                boxShadow: canProceed ? '0 4px 20px rgba(20,144,119,0.3)' : 'none',
                letterSpacing: '-0.01em',
              }}
              onMouseOver={e => { if (canProceed) { (e.currentTarget).style.backgroundColor = '#0e7560'; (e.currentTarget).style.transform = 'translateY(-2px)'; (e.currentTarget).style.boxShadow = '0 8px 28px rgba(20,144,119,0.4)' } }}
              onMouseOut={e => { if (canProceed) { (e.currentTarget).style.backgroundColor = '#149077'; (e.currentTarget).style.transform = 'translateY(0)'; (e.currentTarget).style.boxShadow = '0 4px 20px rgba(20,144,119,0.3)' } }}
            >
              See what they think →
            </button>
            <p style={{ fontSize: '13px', color: 'rgba(2,59,40,0.35)', marginTop: '16px' }}>
              {canProceed ? 'We\'ll show you three honest reactions in about 15 seconds.' : 'Upload a file or paste some content to get started.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'scanning') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#FDFAF7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-inter-tight), sans-serif',
        gap: '20px',
      }}>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.95); }
          }
          @keyframes dotBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
        `}</style>
        <div style={{ fontSize: '48px', animation: 'pulse 2s ease-in-out infinite' }}>🔍</div>
        <h2 style={{
          fontSize: '32px',
          fontWeight: 800,
          color: '#023B28',
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          Reading your training...
        </h2>
        <p style={{ fontSize: '18px', fontWeight: 300, color: '#5a6b63', margin: 0 }}>
          We&rsquo;re sending it to three very opinionated learners.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#149077',
                animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'results' && quickScanResults) {
    const personas: Persona[] = ['skeptic', 'slammed', 'hype']
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#FDFAF7',
        padding: '80px 24px',
        fontFamily: 'var(--font-inter-tight), sans-serif',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#023B28',
            marginBottom: '60px',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            Here&rsquo;s what your learners are actually thinking.
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '72px',
          }}>
            {personas.map(persona => {
              const config = PERSONA_CONFIG[persona]
              return (
                <div key={persona} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    onClick={() => handlePersonaSelect(persona)}
                    style={{
                      backgroundColor: config.bg,
                      borderRadius: '20px',
                      padding: '32px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 12px rgba(2, 59, 40, 0.06)',
                      flex: 1,
                    }}
                    onMouseOver={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.transform = 'translateY(-4px)'
                      el.style.boxShadow = '0 12px 32px rgba(2, 59, 40, 0.14)'
                    }}
                    onMouseOut={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.transform = 'translateY(0)'
                      el.style.boxShadow = '0 2px 12px rgba(2, 59, 40, 0.06)'
                    }}
                  >
                    <div style={{ height: '100px', position: 'relative', overflow: 'hidden', borderRadius: '12px', backgroundColor: config.bg, marginBottom: '16px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={config.image} alt={config.name} style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', height: '96px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#023B28', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                      {config.name}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(2,59,40,0.45)', marginBottom: '14px' }}>
                      {config.personaName}
                    </div>
                    <p style={{ fontSize: '16px', fontStyle: 'italic', color: '#2a3d30', lineHeight: 1.6, margin: 0, fontWeight: 400 }}>
                      &ldquo;{quickScanResults[persona]}&rdquo;
                    </p>
                  </div>
                  {/* Option B: skip to punch list */}
                  <button
                    onClick={() => handlePersonaSelect(persona, true)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 600, color: '#149077',
                      fontFamily: 'var(--font-inter-tight), sans-serif',
                      padding: '6px 0', textAlign: 'center', letterSpacing: '-0.01em',
                      opacity: 0.8, transition: 'opacity 0.15s ease',
                    }}
                    onMouseOver={e => { (e.currentTarget).style.opacity = '1' }}
                    onMouseOut={e => { (e.currentTarget).style.opacity = '0.8' }}
                  >
                    Skip the chat — just give me the list →
                  </button>
                </div>
              )
            })}
          </div>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#023B28',
              marginBottom: '12px',
              letterSpacing: '-0.02em',
            }}>
              Time to dig in and really see what&rsquo;s going on. Pick a seat.
            </h3>
            <p style={{ fontSize: '16px', fontWeight: 300, color: '#5a6b63', margin: 0 }}>
              Click a card above to choose your learner.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'chat' && selectedPersona) {
    const config = PERSONA_CONFIG[selectedPersona]
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        fontFamily: 'var(--font-inter-tight), sans-serif',
        backgroundColor: '#FDFAF7',
        overflow: 'hidden',
      }}>
        {/* Left sidebar */}
        <div style={{
          width: '320px',
          flexShrink: 0,
          backgroundColor: config.bg,
          padding: '40px 28px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(2, 59, 40, 0.08)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: '160px', position: 'relative', overflow: 'hidden', borderRadius: '16px', backgroundColor: config.bg, marginBottom: '20px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.image} alt={config.name} style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', height: '155px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#023B28', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', opacity: 0.6 }}>
              You&rsquo;re talking to
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#023B28', margin: '0 0 2px 0', letterSpacing: '-0.02em' }}>
              {config.personaName}
            </h2>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(2,59,40,0.45)', marginBottom: '20px' }}>
              {config.name}
            </div>
            {quickScanResults && (
              <div style={{
                backgroundColor: 'rgba(2, 59, 40, 0.05)',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#023B28',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '8px',
                  opacity: 0.5,
                }}>
                  First impression
                </div>
                <p style={{
                  fontSize: '14px',
                  fontStyle: 'italic',
                  color: '#2a3d30',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  &ldquo;{quickScanResults[selectedPersona]}&rdquo;
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleGetPunchlist}
            disabled={messages.length < 2}
            style={{
              backgroundColor: messages.length >= 2 ? '#023B28' : 'rgba(2,59,40,0.15)',
              color: messages.length >= 2 ? '#FDFAF7' : 'rgba(2,59,40,0.3)',
              border: 'none',
              borderRadius: '100px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-inter-tight), sans-serif',
              cursor: messages.length >= 2 ? 'pointer' : 'not-allowed',
              width: '100%',
              marginBottom: '10px',
              transition: 'all 0.2s ease',
              letterSpacing: '-0.01em',
            }}
          >
            I&rsquo;m done — get my list →
          </button>
          <button
            onClick={() => {
              setPhase('results')
              setMessages([])
              setExchangeCount(0)
              chatInitialized.current = false
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#149077',
              fontWeight: 600,
              fontFamily: 'var(--font-inter-tight), sans-serif',
              padding: '8px 0',
              textAlign: 'left',
              letterSpacing: '-0.01em',
            }}
          >
            ← Switch persona
          </button>
        </div>

        {/* Right: chat */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}>
          {/* Top bar */}
          <div style={{
            padding: '20px 32px',
            borderBottom: '1px solid rgba(2, 59, 40, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#FDFAF7',
          }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: config.bg, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.image} alt={config.name} style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', height: '30px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
            <span style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#023B28',
            }}>
              {config.name}
            </span>
            <span style={{
              fontSize: '16px',
              fontWeight: 300,
              color: '#5a6b63',
            }}>
              is in your seat
            </span>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            {messages.map((msg, idx) => {
              if (msg.role === 'assistant') {
                if (msg.isCoachMode) {
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#023B28',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        backgroundColor: '#FFF3E8',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        border: '1px solid rgba(2, 59, 40, 0.12)',
                      }}>
                        COACH
                      </div>
                      <div style={{
                        backgroundColor: '#FFF3E8',
                        borderRadius: '16px 16px 16px 4px',
                        padding: '16px 20px',
                        maxWidth: '75%',
                        fontSize: '15px',
                        color: '#023B28',
                        lineHeight: 1.65,
                        fontWeight: 400,
                        boxShadow: '0 1px 4px rgba(2, 59, 40, 0.06)',
                        border: '1px solid rgba(2, 59, 40, 0.08)',
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: config.bg,
                      overflow: 'hidden',
                      flexShrink: 0,
                      position: 'relative',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={config.image} alt={config.name} style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', height: '38px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                    </div>
                    <div style={{
                      backgroundColor: config.bg,
                      borderRadius: '4px 16px 16px 16px',
                      padding: '16px 20px',
                      maxWidth: '75%',
                      fontSize: '15px',
                      fontStyle: 'italic',
                      color: '#2a3d30',
                      lineHeight: 1.65,
                      fontWeight: 400,
                      boxShadow: '0 1px 4px rgba(2, 59, 40, 0.06)',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                )
              }
              // User message
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px 16px 4px 16px',
                    padding: '16px 20px',
                    maxWidth: '75%',
                    fontSize: '15px',
                    color: '#023B28',
                    lineHeight: 1.65,
                    fontWeight: 400,
                    boxShadow: '0 1px 4px rgba(2, 59, 40, 0.08)',
                    border: '1px solid rgba(2, 59, 40, 0.08)',
                  }}>
                    {msg.content}
                  </div>
                </div>
              )
            })}
            {isStreaming && messages[messages.length - 1]?.role === 'user' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: config.bg,
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: 'relative',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={config.image} alt={config.name} style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', height: '38px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>
                <div style={{
                  backgroundColor: config.bg,
                  borderRadius: '4px 16px 16px 16px',
                  padding: '16px 20px',
                  fontSize: '15px',
                  color: '#94a89e',
                  fontStyle: 'italic',
                }}>
                  <style>{`
                    @keyframes typingDot {
                      0%, 100% { opacity: 0.3; }
                      50% { opacity: 1; }
                    }
                  `}</style>
                  <span style={{ animation: 'typingDot 1s 0s infinite' }}>•</span>
                  <span style={{ animation: 'typingDot 1s 0.2s infinite' }}> •</span>
                  <span style={{ animation: 'typingDot 1s 0.4s infinite' }}> •</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: '20px 32px',
            borderTop: '1px solid rgba(2, 59, 40, 0.08)',
            display: 'flex',
            gap: '12px',
            backgroundColor: '#FDFAF7',
          }}>
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="respond here..."
              disabled={isStreaming}
              style={{
                flex: 1,
                padding: '14px 20px',
                borderRadius: '100px',
                border: '2px solid rgba(2, 59, 40, 0.15)',
                backgroundColor: '#ffffff',
                fontSize: '15px',
                fontFamily: 'var(--font-inter-tight), sans-serif',
                fontWeight: 400,
                color: '#023B28',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#149077'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(2, 59, 40, 0.15)'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isStreaming || !inputValue.trim()}
              style={{
                backgroundColor: isStreaming || !inputValue.trim() ? '#c5ddd8' : '#149077',
                color: '#ffffff',
                border: 'none',
                borderRadius: '100px',
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: 'var(--font-inter-tight), sans-serif',
                cursor: isStreaming || !inputValue.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'punchlist' && selectedPersona) {
    const config = PERSONA_CONFIG[selectedPersona]
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const itemCount = punchlistItems?.length ?? 0

    return (
      <div id="punchlist-root" style={{ minHeight: '100vh', backgroundColor: '#F4F1EC', fontFamily: 'var(--font-inter-tight), sans-serif' }}>
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulseDot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.85); } }
          .pl-card { animation: fadeUp 0.4s ease both; }
          .pl-card:nth-child(1) { animation-delay: 0.05s; }
          .pl-card:nth-child(2) { animation-delay: 0.12s; }
          .pl-card:nth-child(3) { animation-delay: 0.19s; }
          .pl-card:nth-child(4) { animation-delay: 0.26s; }
          .pl-card:nth-child(5) { animation-delay: 0.33s; }
          .pl-card:nth-child(6) { animation-delay: 0.40s; }
          .pl-card:nth-child(7) { animation-delay: 0.47s; }
          @media print {
            body { background: #F4F1EC !important; }
            .no-print { display: none !important; }
            .pl-card { break-inside: avoid; page-break-inside: avoid; box-shadow: none !important; border: 1px solid rgba(2,59,40,0.12) !important; }
            #punchlist-root { background: #F4F1EC !important; }
          }
        `}</style>

        {/* ── HEADER ─────────────────────────────────────── */}
        <div style={{ backgroundColor: '#023B28', padding: 'clamp(40px,5vw,64px) clamp(24px,5vw,64px)' }}>
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>

            {/* Top row: meta + download */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Persona avatar */}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: config.bg, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={config.image} alt={config.name} style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', height: '42px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em' }}>
                    {config.name} &nbsp;·&nbsp; {dateStr}
                  </div>
                  {trainingTitle && (
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginTop: '2px', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trainingTitle}
                    </div>
                  )}
                </div>
              </div>
              {punchlistItems && (
                <button
                  className="no-print"
                  onClick={() => window.print()}
                  style={{
                    backgroundColor: '#149077',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '100px',
                    padding: '10px 22px',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-inter-tight), sans-serif',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'background 0.2s ease',
                  }}
                  onMouseOver={e => { (e.currentTarget).style.backgroundColor = '#0e7560' }}
                  onMouseOut={e => { (e.currentTarget).style.backgroundColor = '#149077' }}
                >
                  ↓ Download PDF
                </button>
              )}
            </div>

            {/* Main headline */}
            <h1 style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, color: '#FDFAF7', margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.0 }}>
              Your Punch List.
            </h1>
            {punchlistItems ? (
              <p style={{ fontSize: 'clamp(17px,2vw,22px)', fontWeight: 300, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 800, color: '#FDFAF7' }}>{itemCount}</span> thing{itemCount !== 1 ? 's' : ''} standing between this training and greatness.
              </p>
            ) : (
              <p style={{ fontSize: '18px', fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Building your list...</p>
            )}
          </div>
        </div>

        {/* ── CARDS ──────────────────────────────────────── */}
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: 'clamp(40px,5vw,64px) clamp(24px,5vw,64px)' }}>

          {/* Loading state */}
          {!punchlistItems && !punchlistError && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '60px 0' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#149077', animation: `pulseDot 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
              <p style={{ fontSize: '17px', fontWeight: 300, color: '#5a6b63', margin: 0 }}>Building your punch list...</p>
            </div>
          )}

          {/* Error state */}
          {punchlistError && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '16px', padding: '24px 28px', color: '#991b1b', fontSize: '16px' }}>
              {punchlistError}
            </div>
          )}

          {/* Cards */}
          {punchlistItems && punchlistItems.map((item) => {
            const priority = item.priority as keyof typeof PRIORITY_CONFIG
            const pColor = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG['DO NEXT']
            return (
              <div
                key={item.number}
                className="pl-card"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  padding: 'clamp(24px,3vw,36px)',
                  marginBottom: '20px',
                  boxShadow: '0 2px 12px rgba(2,59,40,0.07), 0 1px 3px rgba(2,59,40,0.04)',
                  display: 'grid',
                  gridTemplateColumns: '72px 1fr',
                  gap: '0 24px',
                }}
              >
                {/* Number */}
                <div style={{
                  fontSize: 'clamp(42px,5vw,60px)',
                  fontWeight: 800,
                  color: '#149077',
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  paddingTop: '2px',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {String(item.number).padStart(2, '0')}
                </div>

                {/* Content */}
                <div>
                  <h3 style={{
                    fontSize: 'clamp(17px,2vw,20px)',
                    fontWeight: 800,
                    color: '#023B28',
                    margin: '0 0 10px',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: '15px',
                    fontWeight: 400,
                    color: 'rgba(2,59,40,0.65)',
                    lineHeight: 1.7,
                    margin: '0 0 20px',
                  }}>
                    {item.detail}
                  </p>
                  {/* Priority pill */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{
                      backgroundColor: pColor.bg,
                      color: pColor.text,
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      padding: '5px 12px',
                      borderRadius: '100px',
                    }}>
                      {item.priority}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Save / download strip */}
          {punchlistItems && (
            <div className="no-print" style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '28px 32px', marginTop: '8px', boxShadow: '0 2px 12px rgba(2,59,40,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#023B28', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Want to keep this?</p>
                <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(2,59,40,0.55)', margin: 0 }}>Download as a PDF or save to your account.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    backgroundColor: '#149077', color: '#fff', border: 'none',
                    borderRadius: '100px', padding: '12px 24px', fontSize: '14px',
                    fontWeight: 700, fontFamily: 'var(--font-inter-tight), sans-serif',
                    cursor: 'pointer', transition: 'background 0.2s ease',
                  }}
                  onMouseOver={e => { (e.currentTarget).style.backgroundColor = '#0e7560' }}
                  onMouseOut={e => { (e.currentTarget).style.backgroundColor = '#149077' }}
                >
                  ↓ Download PDF
                </button>
              </div>
            </div>
          )}

          {/* Confidence after */}
          {punchlistItems && (
            <div className="no-print" style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '28px 32px', marginTop: '16px', boxShadow: '0 2px 12px rgba(2,59,40,0.06)' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#023B28', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                Now that you&rsquo;ve seen the list — how are you feeling about this training?
              </p>
              {confidenceBefore !== null && (
                <p style={{ fontSize: '13px', color: 'rgba(2,59,40,0.45)', margin: '0 0 14px' }}>
                  You rated it {confidenceBefore}/10 before. Let&rsquo;s see if that moved.
                </p>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={async () => {
                      setConfidenceAfter(n)
                      if (sessionId && !confidenceAfterSaved) {
                        setConfidenceAfterSaved(true)
                        await saveConfidenceAfter(sessionId, n)
                      }
                    }}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                      backgroundColor: confidenceAfter === n ? '#149077' : confidenceAfter && n <= confidenceAfter ? 'rgba(20,144,119,0.15)' : 'rgba(2,59,40,0.08)',
                      color: confidenceAfter === n ? '#fff' : '#023B28',
                      fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.15s ease', flexShrink: 0,
                      fontFamily: 'var(--font-inter-tight), sans-serif',
                    }}
                  >{n}</button>
                ))}
                {confidenceAfter && confidenceBefore && (
                  <span style={{ fontSize: '13px', fontWeight: 600, color: confidenceAfter >= confidenceBefore ? '#149077' : 'rgba(2,59,40,0.5)', marginLeft: '8px' }}>
                    {confidenceAfter > confidenceBefore ? `↑ up ${confidenceAfter - confidenceBefore} from before` :
                     confidenceAfter < confidenceBefore ? `↓ down ${confidenceBefore - confidenceAfter}` :
                     'same as before'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Nav buttons */}
          {punchlistItems && (
            <div className="no-print" style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPhase('chat')}
                style={{
                  backgroundColor: 'transparent',
                  color: '#023B28',
                  border: '2px solid rgba(2,59,40,0.2)',
                  borderRadius: '100px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-inter-tight), sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                ← Back to conversation
              </button>
            </div>
          )}
        </div>

        {/* ── BOTTOM CTA ─────────────────────────────────── */}
        {punchlistItems && (
          <div className="no-print" style={{ backgroundColor: '#023B28', padding: 'clamp(40px,5vw,64px) clamp(24px,5vw,64px)', marginTop: '24px' }}>
            <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
              <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#FDFAF7', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Made the fixes? Come back and run it again.
              </h2>
              <p style={{ fontSize: '16px', fontWeight: 300, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                Every round makes the training sharper.
              </p>
              <button
                onClick={() => {
                  setPhase('upload')
                  setMessages([])
                  setExchangeCount(0)
                  setPunchlistItems(null)
                  setPunchlistError(null)
                  setUploadedFile(null)
                  setPastedText('')
                  setTrainingContent('')
                  setQuickScanResults(null)
                  setSelectedPersona(null)
                  setTrainingTitle('')
                  setSessionId(null)
                  setConfidenceBefore(null)
                  setConfidenceAfter(null)
                  setConfidenceAfterSaved(false)
                  chatInitialized.current = false
                }}
                style={{
                  backgroundColor: '#149077',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '100px',
                  padding: '16px 36px',
                  fontSize: '16px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-inter-tight), sans-serif',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  transition: 'background 0.2s ease',
                }}
                onMouseOver={e => { (e.currentTarget).style.backgroundColor = '#0e7560' }}
                onMouseOut={e => { (e.currentTarget).style.backgroundColor = '#149077' }}
              >
                Take another seat →
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
