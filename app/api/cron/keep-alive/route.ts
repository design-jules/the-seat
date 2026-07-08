import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Vercel Cron hits this daily so the Supabase free-tier project never sits idle
// long enough to auto-pause (Supabase pauses after 7 days with no API activity).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createClient()
  const { error } = await supabase.from('access_codes').select('id').limit(1)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, pinged: new Date().toISOString() })
}
