'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Client-side file → text extraction (no upload size limits)
async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()

  if (name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item) => ('str' in item ? (item as { str: string }).str : ''))
        .join(' ')
      pages.push(pageText)
    }
    return pages.join('\n\n')
  }

  if (name.endsWith('.docx')) {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  }

  throw new Error('Unsupported file type. Please upload a PDF or Word doc.')
}

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

function SessionPageInner() {
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<Phase>('upload')
  const [showAccessGate, setShowAccessGate] = useState(false)
  const [pendingPersona, setPendingPersona] = useState<{ persona: Persona; skipToList: boolean } | null>(null)
  const [gateCode, setGateCode] = useState('')
  const [gateCodeError, setGateCodeError] = useState<string | null>(null)
  const [gateCodeLoading, setGateCodeLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [gatePayLoading, setGatePayLoading] = useState(false) // used when beta mode is off
  const [betaEmail, setBetaEmail] = useState('')
  const [betaEmailSent, setBetaEmailSent] = useState(false)
  const [betaEmailLoading, setBetaEmailLoading] = useState(false)
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
  const [userName, setUserName] = useState<string | null>(null)
  const [inputTab, setInputTab] = useState<'upload' | 'paste'>('upload')
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [codeUnlocked, setCodeUnlocked] = useState(false)
  const [inlineCode, setInlineCode] = useState('')
  const [inlineCodeError, setInlineCodeError] = useState<string | null>(null)
  const [inlineCodeLoading, setInlineCodeLoading] = useState(false)
  const [completedSessions, setCompletedSessions] = useState<Array<{ persona: Persona; items: PunchListItem[] }>>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInitialized = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Accumulate completed sessions so we can export a combined PDF
  useEffect(() => {
    if (punchlistItems && punchlistItems.length > 0 && selectedPersona) {
      setCompletedSessions(prev => {
        if (prev.some(s => s.persona === selectedPersona)) return prev
        return [...prev, { persona: selectedPersona, items: punchlistItems }]
      })
    }
  }, [punchlistItems, selectedPersona])

  const handleDownloadPDF = () => {
    const personaLabels: Record<string, string> = {
      skeptic: 'Dana — The Skeptic',
      slammed: 'Marcus — The Slammed',
      hype: 'Bex — The Hype',
    }
    const priorityColors: Record<string, string> = {
      'DO FIRST': '#023B28',
      'DO NEXT': '#149077',
      'NICE TO HAVE': '#8a9e96',
    }
    const win = window.open('', '_blank')
    if (!win) return
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const sectionsHtml = completedSessions.map((s, i) => `
      ${i > 0 ? '<hr style="border:none;border-top:1px solid rgba(2,59,40,0.1);margin:40px 0;">' : ''}
      <div style="margin-bottom:32px;">
        <p style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(2,59,40,0.4);margin:0 0 6px;">${i + 1} of ${completedSessions.length}</p>
        <h2 style="font-size:22px;font-weight:800;color:#023B28;margin:0 0 20px;letter-spacing:-0.02em;">${personaLabels[s.persona] || s.persona}</h2>
        ${s.items.map(item => `
          <div style="display:flex;gap:14px;margin-bottom:16px;align-items:flex-start;">
            <span style="font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${priorityColors[item.priority] || '#149077'};padding:3px 10px;border-radius:100px;background:${priorityColors[item.priority]}18;white-space:nowrap;margin-top:2px;">${item.priority}</span>
            <div>
              <p style="font-size:15px;font-weight:700;color:#023B28;margin:0 0 3px;">${item.title}</p>
              <p style="font-size:14px;color:rgba(2,59,40,0.6);margin:0;line-height:1.5;">${item.detail}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `).join('')
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>The Seat — Session Summary</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 48px 32px; color: #023B28; background: #fff; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div style="margin-bottom:40px;padding-bottom:24px;border-bottom:2px solid #023B28;">
    <p style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(2,59,40,0.4);margin:0 0 8px;">The Seat</p>
    <h1 style="font-size:28px;font-weight:800;color:#023B28;margin:0 0 6px;letter-spacing:-0.02em;">Session Summary</h1>
    <p style="font-size:13px;color:rgba(2,59,40,0.45);margin:0;">${date}${trainingTitle ? ' · ' + trainingTitle : ''}</p>
  </div>
  ${sectionsHtml}
  <p style="font-size:12px;color:rgba(2,59,40,0.3);margin-top:48px;padding-top:16px;border-top:1px solid rgba(2,59,40,0.08);">Generated by theseatmethod.com</p>
  <script>window.onload = () => { window.print() }</script>
</body>
</html>`
    win.document.write(html)
    win.document.close()
  }

  // Handle Stripe success redirect — verify and store access token
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success')
    const stripeSessionId = searchParams.get('session_id')
    if (paymentSuccess === 'true' && stripeSessionId) {
      fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: stripeSessionId }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.valid) {
            sessionStorage.setItem('the-seat-access', 'paid')
            window.history.replaceState({}, '', '/session')
          }
        })
    }
  }, [searchParams])

  // Fetch logged-in user's first name for personalised chat
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const full = user.user_metadata?.full_name || user.user_metadata?.name || ''
        const first = full.split(' ')[0]
        if (first) setUserName(first)
      }
    })
  }, [])

  // Sync code-unlock state from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('the-seat-access')
    if (stored) setCodeUnlocked(true)
  }, [])

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

  const handleInlineCode = async () => {
    if (!inlineCode.trim()) return
    setInlineCodeLoading(true)
    setInlineCodeError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ code: inlineCode }),
      })
      const data = await res.json()
      if (data.valid) {
        sessionStorage.setItem('the-seat-access', 'code')
        setCodeUnlocked(true)
      } else if (data.requiresLogin) {
        setInlineCodeError('Sign in first — codes are tied to your account so only you can use it. Hit "Sign In" in the top right.')
        setInlineCodeLoading(false)
      } else {
        setInlineCodeError(data.message || "That code didn't work. Try again?")
        setInlineCodeLoading(false)
      }
    } catch {
      setInlineCodeError('Something went wrong. Try again.')
      setInlineCodeLoading(false)
    }
  }

  const handleMicClick = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SR() as any
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => { setIsListening(false); setInterimTranscript('') }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      if (final) setPastedText((prev: string) => prev ? `${prev} ${final}` : final)
      setInterimTranscript(interim)
    }
    recognition.start()
  }

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
        content = await extractTextFromFile(uploadedFile)
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
      if (!res.ok) {
        throw new Error(`Analysis failed (${res.status}). Please try again.`)
      }
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setQuickScanResults(data)
      setPhase('results')
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Failed to analyze training content.')
      setPhase('upload')
    }
  }

  const proceedWithPersona = async (persona: Persona, skipToList: boolean) => {
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

  const handlePersonaSelect = async (persona: Persona, skipToList = false) => {
    // Check sessionStorage first (fast)
    const stored = sessionStorage.getItem('the-seat-access')
    if (stored === 'paid' || stored === 'code') {
      proceedWithPersona(persona, skipToList)
      return
    }
    // Check if signed-in user is permanently approved
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('approved_users')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
      if (data) {
        sessionStorage.setItem('the-seat-access', 'approved')
        proceedWithPersona(persona, skipToList)
        return
      }
    }
    setPendingPersona({ persona, skipToList })
    setShowAccessGate(true)
  }

  const handleBetaEmailRequest = async () => {
    if (!betaEmail.trim()) return
    setBetaEmailLoading(true)
    try {
      const supabase = createClient()
      await supabase.from('beta_requests').insert({ email: betaEmail.trim() })
      // Also ping theseatmethod@gmail.com via formsubmit
      await fetch('https://formsubmit.co/ajax/theseatmethod@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: 'New beta code request', email: betaEmail.trim(), message: `${betaEmail.trim()} wants a beta code for The Seat.` }),
      })
      setBetaEmailSent(true)
    } catch {
      setBetaEmailSent(true) // show success even if save fails
    } finally {
      setBetaEmailLoading(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGatePay = async () => {
    setGatePayLoading(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: window.location.origin }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setGatePayLoading(false)
    }
  }

  const handleGateCode = async () => {
    if (!gateCode.trim()) return
    setGateCodeLoading(true)
    setGateCodeError(null)
    try {
      const res = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: gateCode }),
      })
      const data = await res.json()
      if (data.valid) {
        sessionStorage.setItem('the-seat-access', 'code')
        setShowAccessGate(false)
        if (pendingPersona) {
          proceedWithPersona(pendingPersona.persona, pendingPersona.skipToList)
          setPendingPersona(null)
        }
      } else {
        setGateCodeError(data.message || 'Invalid code. Try again.')
        setGateCodeLoading(false)
      }
    } catch {
      setGateCodeError('Something went wrong. Try again.')
      setGateCodeLoading(false)
    }
  }

  const streamMessage = useCallback(async (msgs: Message[], count: number, persona: Persona, content: string, name?: string | null) => {
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
          userName: name ?? undefined,
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
      streamMessage([], 0, selectedPersona, trainingContent, userName)
    }
  }, [phase, selectedPersona, trainingContent, streamMessage, userName])

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
      trainingContent,
      userName
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

  if (showAccessGate) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: 'rgba(2,59,40,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        fontFamily: 'var(--font-inter-tight), sans-serif',
      }}>
        <div style={{ backgroundColor: '#FDFAF7', borderRadius: '24px', padding: 'clamp(32px,5vw,48px)', maxWidth: '460px', width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>

          {/* Beta banner */}
          <div style={{ backgroundColor: '#E2F3F0', borderRadius: '10px', padding: '8px 14px', marginBottom: '20px', display: 'inline-block' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#023B28', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Beta Testing</span>
          </div>

          <h2 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 800, color: '#023B28', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '12px' }}>
            Ready to go deeper?
          </h2>
          <p style={{ fontSize: '16px', fontWeight: 300, color: 'rgba(2,59,40,0.6)', lineHeight: 1.6, marginBottom: '24px' }}>
            We&apos;re in beta testing right now. Sign in with Google or drop your email below and we&apos;ll send you a one-time code to try it out.
          </p>

          {/* Google sign-in */}
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/auth/callback?next=/session` },
              })
            }}
            style={{
              width: '100%', padding: '13px 20px', borderRadius: '100px',
              border: '2px solid rgba(2,59,40,0.15)', backgroundColor: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              cursor: 'pointer', fontSize: '15px', fontWeight: 700,
              fontFamily: 'var(--font-inter-tight), sans-serif', color: '#023B28',
              marginBottom: '8px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            Sign in with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(2,59,40,0.1)' }} />
            <span style={{ fontSize: '12px', color: 'rgba(2,59,40,0.35)', fontWeight: 500 }}>or request a code</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(2,59,40,0.1)' }} />
          </div>

          {/* Beta email request */}
          {betaEmailSent ? (
            <div style={{ backgroundColor: '#E2F3F0', borderRadius: '14px', padding: '20px', textAlign: 'center', marginBottom: '12px' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#023B28', margin: '0 0 4px' }}>You&apos;re on the list!</p>
              <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(2,59,40,0.6)', margin: 0 }}>We&apos;ll send your code shortly.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="email"
                value={betaEmail}
                onChange={e => setBetaEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleBetaEmailRequest()}
                placeholder="your@email.com"
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: '100px',
                  border: '2px solid rgba(2,59,40,0.15)', backgroundColor: '#fff',
                  fontSize: '15px', fontFamily: 'var(--font-inter-tight), sans-serif',
                  fontWeight: 400, color: '#023B28', outline: 'none',
                }}
              />
              <button
                onClick={handleBetaEmailRequest}
                disabled={betaEmailLoading || !betaEmail.trim()}
                style={{
                  backgroundColor: betaEmail.trim() ? '#149077' : 'rgba(2,59,40,0.15)',
                  color: betaEmail.trim() ? '#fff' : 'rgba(2,59,40,0.3)',
                  border: 'none', borderRadius: '100px', padding: '12px 20px',
                  fontSize: '14px', fontWeight: 700,
                  fontFamily: 'var(--font-inter-tight), sans-serif',
                  cursor: betaEmail.trim() && !betaEmailLoading ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                }}
              >
                {betaEmailLoading ? '...' : 'Send →'}
              </button>
            </div>
          )}

          {/* Divider before code entry */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0 16px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(2,59,40,0.1)' }} />
            <span style={{ fontSize: '12px', color: 'rgba(2,59,40,0.35)', fontWeight: 500 }}>already have a code?</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(2,59,40,0.1)' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              value={gateCode}
              onChange={e => { setGateCode(e.target.value.toUpperCase()); setGateCodeError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleGateCode()}
              placeholder="ENTER CODE"
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '100px',
                border: `2px solid ${gateCodeError ? '#fca5a5' : 'rgba(2,59,40,0.15)'}`,
                backgroundColor: '#fff', fontSize: '15px',
                fontFamily: 'var(--font-inter-tight), sans-serif',
                fontWeight: 700, color: '#023B28', letterSpacing: '0.08em', outline: 'none',
              }}
            />
            <button
              onClick={handleGateCode}
              disabled={gateCodeLoading || !gateCode.trim()}
              style={{
                backgroundColor: gateCode.trim() ? '#149077' : 'rgba(2,59,40,0.15)',
                color: gateCode.trim() ? '#fff' : 'rgba(2,59,40,0.3)',
                border: 'none', borderRadius: '100px', padding: '12px 20px',
                fontSize: '14px', fontWeight: 700,
                fontFamily: 'var(--font-inter-tight), sans-serif',
                cursor: gateCode.trim() && !gateCodeLoading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              }}
            >
              {gateCodeLoading ? '...' : 'Go →'}
            </button>
          </div>

          {gateCodeError && (
            <p style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 8px', fontWeight: 500 }}>{gateCodeError}</p>
          )}

          <button
            onClick={() => { setShowAccessGate(false); setPendingPersona(null) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', color: 'rgba(2,59,40,0.4)', fontWeight: 500,
              fontFamily: 'var(--font-inter-tight), sans-serif',
              marginTop: '12px', padding: '4px 0',
            }}
          >
            ← Back to results
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'upload') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FDFAF7', fontFamily: 'var(--font-inter-tight), Inter Tight, sans-serif', paddingTop: '57px' }}>
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes floatBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
          .upload-zone-label:hover .upload-zone-inner { border-color: #023B28; box-shadow: 0 0 0 6px rgba(20,144,119,0.15), 0 12px 40px rgba(2,59,40,0.1); background: #f0faf7; }
          .upload-zone-label:hover .upload-zone-icon { animation: floatBob 1s ease-in-out infinite; }
          .persona-peek:hover { transform: translateY(-4px) scale(1.03); }
        `}</style>

        {/* Hero headline */}
        <div style={{ textAlign: 'center', padding: 'clamp(48px, 7vw, 80px) clamp(24px, 5vw, 60px) 0', animation: 'fadeUp 0.5s ease both' }}>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, color: '#023B28', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '20px' }}>
            Drop your training.<br />Get three honest seats.
          </h1>
          <p style={{ fontSize: 'clamp(17px, 2vw, 21px)', fontWeight: 300, color: 'rgba(2,59,40,0.6)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
            Upload your slides or paste your content. Three very different learners are waiting to read it. None of them are going to hold back.
          </p>
        </div>

        {/* Persona showcase */}
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 40px) clamp(32px, 4vw, 48px)', animation: 'fadeUp 0.5s 0.1s ease both' }}>
          <div className="session-persona-triptych" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderRadius: '24px', boxShadow: '0 8px 40px rgba(2,59,40,0.12)' }}>
            {([
              { img: '/the_skeptic2.png', name: 'The Skeptic', personaName: 'Dana', bg: '#2a3d30', textColor: '#fff', quote: "Hi, I'm Dana. I'm skeptical of most training and I'll tell you exactly why.", blend: 'screen' as const },
              { img: '/the_slammed2.png', name: 'The Slammed', personaName: 'Marcus', bg: '#E2F3F0', textColor: '#023B28', quote: "Hi, I'm Marcus. I'm kind of busy right now. But I'll tell you how to get through to me if you want.", blend: 'multiply' as const },
              { img: '/the_hype2.png',    name: 'The Hype',    personaName: 'Bex',   bg: '#EBD6E9', textColor: '#023B28', quote: "Hi, I'm Bex. I am SO excited to be here! But honestly? I probably won't do anything with this. Want to help me change that?", blend: 'multiply' as const },
            ] as const).map((p, i) => (
              <div key={p.name} style={{
                backgroundColor: p.bg,
                padding: '32px 24px 28px',
                borderRight: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}>
                <div style={{ height: '260px', position: 'relative', width: '100%', marginBottom: '20px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.img} alt={p.name} style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', height: '250px', objectFit: 'contain', mixBlendMode: p.blend }} />
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: p.textColor, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.55, marginBottom: '3px' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: p.textColor, opacity: 0.4, marginBottom: '14px' }}>
                  {p.personaName}
                </div>
                <p style={{ fontSize: '15px', fontStyle: 'italic', color: p.textColor, lineHeight: 1.5, margin: 0, opacity: 0.85, fontWeight: 400 }}>
                  {p.quote}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Beta access banner ───────────────────────────────── */}
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 clamp(24px, 5vw, 40px) 20px', animation: 'fadeUp 0.5s 0.15s ease both' }}>
          {codeUnlocked ? (
            <div style={{ backgroundColor: 'rgba(20,144,119,0.08)', border: '1px solid rgba(20,144,119,0.2)', borderRadius: '12px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '15px' }}>✓</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#149077' }}>Access unlocked — you&apos;re in.</span>
            </div>
          ) : (
            <div style={{ backgroundColor: '#023B28', borderRadius: '16px', padding: '20px 24px' }}>
              <p style={{ color: '#FDFAF7', fontWeight: 700, fontSize: '14px', margin: '0 0 4px' }}>
                Beta access required
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 14px' }}>
                Got a code? Enter it below to unlock The Seat.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  value={inlineCode}
                  onChange={e => { setInlineCode(e.target.value.toUpperCase()); setInlineCodeError(null) }}
                  onKeyDown={e => e.key === 'Enter' && handleInlineCode()}
                  placeholder="ENTER CODE"
                  style={{
                    flex: 1, minWidth: '140px', padding: '11px 18px', borderRadius: '100px',
                    border: `2px solid ${inlineCodeError ? '#fca5a5' : 'rgba(255,255,255,0.15)'}`,
                    background: 'rgba(255,255,255,0.08)', color: '#fff',
                    fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em',
                    fontFamily: 'var(--font-inter-tight), sans-serif', outline: 'none',
                  }}
                />
                <button
                  onClick={handleInlineCode}
                  disabled={inlineCodeLoading || !inlineCode.trim()}
                  style={{
                    backgroundColor: inlineCode.trim() ? '#c4ff00' : 'rgba(255,255,255,0.12)',
                    color: inlineCode.trim() ? '#023B28' : 'rgba(255,255,255,0.3)',
                    border: 'none', borderRadius: '100px', padding: '11px 24px',
                    fontSize: '14px', fontWeight: 800,
                    fontFamily: 'var(--font-inter-tight), sans-serif',
                    cursor: inlineCode.trim() && !inlineCodeLoading ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {inlineCodeLoading ? '...' : 'Unlock →'}
                </button>
              </div>
              {inlineCodeError && (
                <p style={{ color: '#fca5a5', fontSize: '13px', fontWeight: 500, margin: '8px 0 0' }}>
                  {inlineCodeError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Upload form */}
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 clamp(24px, 5vw, 40px) 80px', animation: 'fadeUp 0.5s 0.2s ease both' }}>

          {scanError && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 20px', marginBottom: '24px', color: '#991b1b', fontSize: '15px' }}>
              {scanError}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'none' }}
          />

          {/* Tabbed input card */}
          <div style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 4px 32px rgba(2,59,40,0.09)', overflow: 'hidden', marginBottom: '24px', border: '1px solid rgba(2,59,40,0.07)' }}>

            {/* Tab switcher */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(2,59,40,0.08)', padding: '0 24px' }}>
              {(['upload', 'paste'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setInputTab(tab)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '16px 20px 14px',
                    fontSize: '14px', fontWeight: 700,
                    color: inputTab === tab ? '#149077' : 'rgba(2,59,40,0.4)',
                    borderBottom: inputTab === tab ? '2px solid #149077' : '2px solid transparent',
                    marginBottom: '-1px',
                    fontFamily: 'var(--font-inter-tight), sans-serif',
                    transition: 'color 0.15s',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {tab === 'upload' ? 'Upload a file' : 'Paste text'}
                </button>
              ))}
            </div>

            {/* Upload tab */}
            {inputTab === 'upload' && (
              <div style={{ padding: '24px' }}>
                <div
                  onClick={openFilePicker}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="upload-zone-label"
                  style={{
                    border: `2px dashed ${isDragging ? '#023B28' : 'rgba(20,144,119,0.4)'}`,
                    borderRadius: '16px',
                    padding: '48px 32px',
                    cursor: 'pointer',
                    backgroundColor: isDragging ? '#f0faf7' : 'rgba(20,144,119,0.03)',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    userSelect: 'none',
                  }}
                >
                  {uploadedFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(20,144,119,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M4 10l4.5 4.5 7.5-8" stroke="#149077" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div style={{ fontWeight: 700, color: '#023B28', fontSize: '17px' }}>{uploadedFile.name}</div>
                      <div style={{ fontSize: '13px', color: '#149077', fontWeight: 600 }}>Ready. Click to swap.</div>
                    </div>
                  ) : isDragging ? (
                    <p style={{ fontWeight: 700, color: '#023B28', fontSize: '20px', margin: 0 }}>go ahead, drop it</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div className="upload-zone-icon" style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(20,144,119,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4v12M7 8l5-5 5 5" stroke="#149077" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 18h16" stroke="#149077" strokeWidth="2" strokeLinecap="round"/></svg>
                      </div>
                      <p style={{ fontWeight: 700, color: '#023B28', fontSize: '18px', margin: 0 }}>Drag here or click to upload</p>
                      <p style={{ fontSize: '14px', color: 'rgba(2,59,40,0.45)', margin: 0 }}>PDF or Word doc</p>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(2,59,40,0.35)', textAlign: 'center', marginTop: '12px', marginBottom: 0 }}>
                  Got a PowerPoint? Export as PDF first: File → Export → PDF.
                </p>
              </div>
            )}

            {/* Paste tab */}
            {inputTab === 'paste' && (
              <div style={{ padding: '24px' }}>
                <textarea
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder="Paste your slide outline, facilitator notes, session plan, handout copy. Whatever you've got. Even rough notes work."
                  style={{
                    width: '100%', minHeight: '220px', borderRadius: '12px',
                    border: '1.5px solid rgba(2,59,40,0.12)', backgroundColor: 'rgba(20,144,119,0.03)',
                    padding: '16px 18px', fontSize: '15px',
                    fontFamily: 'var(--font-inter-tight), Inter Tight, sans-serif',
                    fontWeight: 300, color: '#023B28', resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box', lineHeight: 1.6,
                  }}
                  onFocus={e => { e.target.style.borderColor = '#149077'; e.target.style.boxShadow = '0 0 0 3px rgba(20,144,119,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(2,59,40,0.12)'; e.target.style.boxShadow = 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    onClick={handleMicClick}
                    title={isListening ? 'Listening...' : 'Speak your training content'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: isListening ? 'rgba(220,38,38,0.08)' : 'rgba(20,144,119,0.08)',
                      border: `1.5px solid ${isListening ? 'rgba(220,38,38,0.3)' : 'rgba(20,144,119,0.25)'}`,
                      borderRadius: '100px', padding: '7px 14px',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                      color: isListening ? '#dc2626' : '#149077',
                      fontFamily: 'var(--font-inter-tight), sans-serif',
                      transition: 'all 0.15s',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor"/>
                      <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {isListening ? 'Listening...' : 'Speak it instead'}
                  </button>
                </div>
                {isListening && (
                  <p style={{ fontSize: '13px', color: 'rgba(2,59,40,0.45)', fontStyle: 'italic', marginTop: '6px', marginBottom: 0, minHeight: '20px' }}>
                    {interimTranscript || '...'}
                  </p>
                )}
                {pastedText.trim().length > 0 && pastedText.trim().length < 200 && (
                  <p style={{ fontSize: '13px', color: 'rgba(232,145,58,0.9)', marginTop: '8px', marginBottom: 0, fontWeight: 500 }}>
                    The more detail you give, the more honest the reactions will be.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Confidentiality notice */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', backgroundColor: '#FFF8EE', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,193,7,0.25)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8s2.91 6.5 6.5 6.5S14.5 11.59 14.5 8 11.59 1.5 8 1.5zm.75 9.75h-1.5v-4.5h1.5v4.5zm0-6h-1.5v-1.5h1.5v1.5z" fill="rgba(2,59,40,0.35)"/>
            </svg>
            <p style={{ fontSize: '12px', color: 'rgba(2,59,40,0.5)', margin: 0, lineHeight: 1.55 }}>
              <strong style={{ color: 'rgba(2,59,40,0.65)', fontWeight: 600 }}>Your content stays private.</strong> We do not store your training files or content. Everything is used only during this session and is gone once you leave.
            </p>
          </div>

          {/* Confidence rating */}
          <div style={{ marginBottom: '28px', backgroundColor: 'rgba(2,59,40,0.04)', borderRadius: '16px', padding: '20px 24px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#023B28', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
              How confident are you this training is awesome?
            </p>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={confidenceBefore ?? 5}
              onChange={e => setConfidenceBefore(Number(e.target.value))}
              onPointerDown={() => { if (confidenceBefore === null) setConfidenceBefore(5) }}
              className="confidence-slider"
              style={{
                background: `linear-gradient(to right, #149077 0%, #149077 ${((confidenceBefore ?? 5) - 1) / 9 * 100}%, rgba(2,59,40,0.12) ${((confidenceBefore ?? 5) - 1) / 9 * 100}%, rgba(2,59,40,0.12) 100%)`,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(2,59,40,0.4)', fontWeight: 500, maxWidth: '80px' }}>not confident</span>
              {confidenceBefore !== null && (
                <span style={{ fontSize: '32px', fontWeight: 800, color: '#149077', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {confidenceBefore}<span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(2,59,40,0.4)', letterSpacing: 0 }}>/10</span>
                </span>
              )}
              <span style={{ fontSize: '11px', color: 'rgba(2,59,40,0.4)', fontWeight: 500, maxWidth: '110px', textAlign: 'right' }}>have never believed in anything more!</span>
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
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(20,144,119,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s ease-in-out infinite' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="12" cy="12" r="7" stroke="#149077" strokeWidth="2.5"/><path d="M17.5 17.5L23 23" stroke="#149077" strokeWidth="2.5" strokeLinecap="round"/></svg>
        </div>
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

          <div className="persona-results-grid">
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
                    Skip the chat, just give me the list →
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
        height: '100dvh',
        display: 'flex',
        fontFamily: 'var(--font-inter-tight), sans-serif',
        backgroundColor: '#FDFAF7',
        overflow: 'hidden',
      }}>
        <style>{`
          .chat-sidebar {
            width: 320px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            border-right: 1px solid rgba(2,59,40,0.08);
          }
          .chat-mobile-bar { display: none; }
          @media (max-width: 768px) {
            .chat-sidebar { display: none; }
            .chat-mobile-bar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 10px 16px;
              border-bottom: 1px solid rgba(2,59,40,0.08);
              background: #FDFAF7;
              gap: 10px;
              flex-shrink: 0;
            }
            .chat-messages { padding: 16px !important; }
            .chat-input-area { padding: 12px 16px !important; }
          }
        `}</style>

        {/* Mobile-only top bar */}
        <div className="chat-mobile-bar" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: config.bg, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.image} alt={config.name} style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', height: '34px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#023B28', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{config.name}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => { setPhase('results'); setMessages([]); setExchangeCount(0); chatInitialized.current = false; }}
              style={{ background: 'none', border: '1.5px solid rgba(2,59,40,0.2)', borderRadius: '100px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#023B28', cursor: 'pointer', fontFamily: 'inherit' }}>
              Switch
            </button>
            <button onClick={handleGetPunchlist} disabled={messages.length < 2}
              style={{ background: messages.length >= 2 ? '#023B28' : 'rgba(2,59,40,0.15)', color: messages.length >= 2 ? '#FDFAF7' : 'rgba(2,59,40,0.3)', border: 'none', borderRadius: '100px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: messages.length >= 2 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              Get my list →
            </button>
          </div>
        </div>

        {/* Left sidebar — desktop only */}
        <div className="chat-sidebar" style={{
          backgroundColor: config.bg,
          padding: '40px 28px',
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
            I&rsquo;m done. Get my list →
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
          <div className="chat-messages" style={{
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
          <div className="chat-input-area" style={{
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
              Here&rsquo;s your punch list
            </h1>
            {punchlistItems ? (
              <>
                <p style={{ fontSize: 'clamp(17px,2vw,22px)', fontWeight: 300, color: 'rgba(255,255,255,0.65)', margin: '0 0 12px', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 800, color: '#FDFAF7' }}>{itemCount}</span> thing{itemCount !== 1 ? 's' : ''} standing between this training and greatness.
                </p>
                <p style={{ fontSize: 'clamp(14px,1.5vw,16px)', fontWeight: 400, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5, maxWidth: '560px' }}>
                  {selectedPersona === 'skeptic' && 'These are the sticky, memorable changes to make sure the skeptics in your classroom leave convinced. Not just tolerated.'}
                  {selectedPersona === 'slammed' && 'These are the sticky, memorable changes to make sure the overloaded, time-pressed learners in your classroom actually get what they need.'}
                  {selectedPersona === 'hype' && "These are the sticky, memorable changes to make sure your most enthusiastic learners don't just feel inspired. They actually do something differently on Monday."}
                </p>
              </>
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
                Now that you&rsquo;ve seen the list: how are you feeling about this training?
              </p>
              {confidenceBefore !== null && (
                <p style={{ fontSize: '13px', color: 'rgba(2,59,40,0.45)', margin: '0 0 16px' }}>
                  You rated it {confidenceBefore}/10 before. Let&rsquo;s see if that moved.
                </p>
              )}
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={confidenceAfter ?? 5}
                onChange={e => setConfidenceAfter(Number(e.target.value))}
                onPointerDown={() => { if (confidenceAfter === null) setConfidenceAfter(5) }}
                onPointerUp={async (e) => {
                  const val = Number((e.target as HTMLInputElement).value)
                  if (sessionId) await saveConfidenceAfter(sessionId, val)
                }}
                className="confidence-slider"
                style={{
                  background: `linear-gradient(to right, #149077 0%, #149077 ${((confidenceAfter ?? 5) - 1) / 9 * 100}%, rgba(2,59,40,0.12) ${((confidenceAfter ?? 5) - 1) / 9 * 100}%, rgba(2,59,40,0.12) 100%)`,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(2,59,40,0.4)', fontWeight: 500, maxWidth: '80px' }}>not confident</span>
                {confidenceAfter !== null && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: '#149077', letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {confidenceAfter}<span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(2,59,40,0.4)', letterSpacing: 0 }}>/10</span>
                    </span>
                    {confidenceBefore !== null && (
                      <span style={{ fontSize: '12px', fontWeight: 600, color: confidenceAfter >= confidenceBefore ? '#149077' : 'rgba(2,59,40,0.5)' }}>
                        {confidenceAfter > confidenceBefore ? `↑ up ${confidenceAfter - confidenceBefore} from before` :
                         confidenceAfter < confidenceBefore ? `↓ down ${confidenceBefore - confidenceAfter}` :
                         'same as before'}
                      </span>
                    )}
                  </div>
                )}
                <span style={{ fontSize: '11px', color: 'rgba(2,59,40,0.4)', fontWeight: 500, maxWidth: '110px', textAlign: 'right' }}>have never believed in anything more!</span>
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
                Want to hear from someone else?
              </h2>
              <p style={{ fontSize: '16px', fontWeight: 300, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                Try a different seat with the same training, or start fresh with something new.
              </p>

              {/* PDF export — always available, gets richer as more personas are done */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px 28px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#FDFAF7', margin: '0 0 2px' }}>
                    {completedSessions.length === 3 ? 'All three seats complete.' : `${completedSessions.length} of 3 personas done.`}
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                    {completedSessions.length === 3
                      ? 'Download the full summary to share with your team.'
                      : 'You can download now or finish all three for the full picture.'}
                  </p>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  style={{ backgroundColor: '#149077', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px 28px', fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-inter-tight), sans-serif', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseOver={e => { (e.currentTarget).style.backgroundColor = '#0e7560' }}
                  onMouseOut={e => { (e.currentTarget).style.backgroundColor = '#149077' }}
                >
                  ↓ Download PDF
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setPhase('results')
                    setMessages([])
                    setExchangeCount(0)
                    setPunchlistItems(null)
                    setPunchlistError(null)
                    setSelectedPersona(null)
                    setSessionId(null)
                    setConfidenceAfter(null)
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
                  Try a different seat →
                </button>
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
                    chatInitialized.current = false
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'rgba(255,255,255,0.65)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '100px',
                    padding: '16px 36px',
                    fontSize: '16px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-inter-tight), sans-serif',
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={e => { (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.4)'; (e.currentTarget).style.color = '#fff' }}
                  onMouseOut={e => { (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.2)'; (e.currentTarget).style.color = 'rgba(255,255,255,0.65)' }}
                >
                  Upload new training
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}

export default function SessionPage() {
  return (
    <Suspense>
      <SessionPageInner />
    </Suspense>
  )
}
