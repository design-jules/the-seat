import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    if (!code) return NextResponse.json({ valid: false })

    const supabase = createClient()

    // Check code exists (no used_at check — codes are reusable)
    const { data, error } = await supabase
      .from('access_codes')
      .select('id')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (error || !data) return NextResponse.json({ valid: false, message: 'Code not found.' })

    // If a user is signed in, save them as permanently approved
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('approved_users')
        .upsert({ user_id: user.id, approved_via: 'code' }, { onConflict: 'user_id' })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Validate code error:', error)
    return NextResponse.json({ valid: false, message: 'Something went wrong.' })
  }
}
