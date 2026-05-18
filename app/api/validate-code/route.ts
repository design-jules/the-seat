import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    if (!code) return NextResponse.json({ valid: false })

    const supabase = createClient()
    const { data, error } = await supabase
      .from('access_codes')
      .select('id, used_at')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (error || !data) return NextResponse.json({ valid: false, message: 'Code not found.' })
    if (data.used_at) return NextResponse.json({ valid: false, message: 'This code has already been used.' })

    // Mark as used
    await supabase
      .from('access_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', data.id)

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Validate code error:', error)
    return NextResponse.json({ valid: false, message: 'Something went wrong.' })
  }
}
