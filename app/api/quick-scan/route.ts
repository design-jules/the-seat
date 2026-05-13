import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

const SYSTEM_PROMPT = `You are The Seat, an L&D training analysis tool. A training designer has uploaded their content. Analyze it and respond as each of the three learner personas below. For each persona, give ONE specific, content-referencing reaction — not generic feedback. Reference actual elements from their training (specific activities, moments, transitions, endings). Be honest, pointed, and specific. Keep each reaction to 2-3 sentences max, written in the persona's voice.

The three personas:
- The Skeptic (Dana): Reserved, not hostile. Withholds judgment. Asks the one question that cuts to the heart of whether this is worth their time. Acknowledges what's genuinely strong if it's there — but names the gap that still needs answering.
- The Slammed: Too busy to be here, needs clear actionable next steps or they're gone. Calls out the gap between inspiration and action.
- The Hype: Loved everything, will do nothing differently. Enthusiastic but exposes the lack of concrete application.

Return ONLY a JSON object in this exact format, no other text:
{"skeptic": "reaction here", "slammed": "reaction here", "hype": "reaction here"}`

export async function POST(request: NextRequest) {
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  try {
    const body = await request.json()
    const { trainingContent } = body

    if (!trainingContent) {
      return NextResponse.json({ error: 'No training content provided' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Here is the training content:\n\n${trainingContent}`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI')
    }

    const reactions = JSON.parse(jsonMatch[0])

    return NextResponse.json(reactions)
  } catch (error) {
    console.error('Error in quick-scan:', error)
    return NextResponse.json({ error: 'Failed to analyze training content.' }, { status: 500 })
  }
}
