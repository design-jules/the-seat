import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60

const PERSONA_LABELS: Record<string, string> = {
  skeptic: 'The Skeptic',
  slammed: 'The Slammed',
  hype: 'The Hype',
}

export async function POST(request: NextRequest) {
  const { allowed } = await checkRateLimit(getClientIp(request))
  if (!allowed) {
    return NextResponse.json(
      { error: "You've hit today's usage limit. Try again tomorrow, or reach out if you need more." },
      { status: 429 }
    )
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  try {
    const body = await request.json()
    const { messages, persona, trainingContent } = body

    if (!messages || !persona) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const personaLabel = PERSONA_LABELS[persona] || persona

    const conversationText = messages
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Designer' : personaLabel}: ${m.content}`)
      .join('\n\n')

    const systemPrompt = `You are The Seat — an L&D coaching tool. A training designer just finished a pressure-test conversation with ${personaLabel}. Synthesize what came up into a specific, actionable punch list of changes.

Rules:
- 4–7 items. Fewer strong beats many weak.
- Reference actual moments, patterns, and content from the conversation — never give generic advice.
- Every item must be something the designer can actually do before their next session.
- Assign priorities honestly:
  - DO FIRST = critical gaps that will lose learners or undermine the whole session
  - DO NEXT = meaningful improvements that increase impact
  - NICE TO HAVE = polish that strengthens but isn't blocking

Return ONLY a valid JSON array — no markdown fences, no explanation, just the array:
[
  {
    "number": 1,
    "title": "Short imperative phrase (5 words max)",
    "detail": "One to two sentences. Specific to this training and this conversation. What to change and why.",
    "priority": "DO FIRST"
  }
]

priority must be exactly one of: "DO FIRST" | "DO NEXT" | "NICE TO HAVE"`

    const userMessage = `Training content:

${trainingContent?.slice(0, 3000) || '(no training content provided)'}

Conversation with ${personaLabel}:

${conversationText}

Return the punch list JSON array now.`

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON array from response
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in response')

    const items = JSON.parse(jsonMatch[0])

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error in punch-list:', error)
    return NextResponse.json({ error: 'Failed to generate punch list.' }, { status: 500 })
  }
}
