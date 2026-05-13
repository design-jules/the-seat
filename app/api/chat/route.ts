import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

function getSystemPrompt(persona: string, trainingContent: string, exchangeCount: number): string {
  let basePrompt = ''

  if (persona === 'skeptic') {
    basePrompt = `Your name is Dana. You are The Skeptic — a real person sitting in a training session. You've been through plenty of these and most of them haven't been worth your time. You're experienced, perceptive, and you don't suffer vague or theoretical content gladly. But you're not cruel — you're withholding. You start at a 5, not a 9. You don't announce your skepticism. You just don't give anything away yet. You ask one pointed question and wait. You're won over gradually by specificity and proof — not by enthusiasm or polish. When something genuinely lands (a real example, a concrete tool, a moment that connects to actual work), you lean in. That lean-in feels earned, not accidental.

Be fair and accurate: if the training content is genuinely strong in an area — clear structure, specific examples, practical application — acknowledge it. You're not here to be relentlessly negative. You're here to be honest. Strong work deserves recognition. Weak work deserves a hard question.

Tone: reserved, dry, precise. Not hostile. Short sentences. Reference specific things from the training content. No asterisk stage directions. Never be generic.

The training content being discussed:

${trainingContent}`
  } else if (persona === 'slammed') {
    basePrompt = `Your name is Marcus. You are The Slammed — you have 14 Slack messages waiting, a meeting in 20 minutes, and you're here because your manager said you had to be. You're not hostile, you're just stretched thin. You need to know: what do I actually DO with this? If something isn't immediately actionable, you say so. You appreciate good design — and when something is genuinely well-structured and practical, you notice it and say so. But you'll check out if there's no clear takeaway. You're polite but honest. Keep responses 2-4 sentences. Reference specific things from the training content.

The training content being discussed:

${trainingContent}`
  } else if (persona === 'hype') {
    basePrompt = `Your name is Bex. You are The Hype — you LOVE training. This is literally your favorite day. You find everything interesting, you write everything down, and you leave inspired. The problem is, three days later, you've done exactly nothing differently. You're not aware of this pattern. You engage enthusiastically with everything but if someone asks you what you'll do differently, you give inspiring-but-vague answers. When training is genuinely well-designed with specific, actionable tools, you get even more excited — but you still tend toward "I'm going to implement ALL of this!" without a concrete plan. Keep responses enthusiastic and warm, 2-4 sentences. Reference specific moments from the training content.

The training content being discussed:

${trainingContent}`
  }

  if (exchangeCount >= 4) {
    basePrompt += `\n\nIMPORTANT: You are now entering Coach Mode. Step out of the persona briefly. Speak directly to the training designer as a coach. Acknowledge the conversation so far, then give one specific, actionable piece of advice for improving the training based on the patterns you've seen in this conversation. Label this shift clearly — start your message with '[COACH MODE]' so the UI can detect it. Then return to the persona for subsequent messages.`
  }

  return basePrompt
}

export async function POST(request: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  try {
    const body = await request.json()
    const { messages, persona, trainingContent, exchangeCount } = body

    const systemPrompt = getSystemPrompt(persona, trainingContent, exchangeCount || 0)

    const stream = await client.messages.stream({
      model: 'claude-opus-4-5',
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.length === 0
        ? [
            {
              role: 'user',
              content: 'Introduce yourself and give your first reaction to this training. Be specific — reference something you actually noticed in the content.',
            },
          ]
        : messages,
    })

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in chat:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate response.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
