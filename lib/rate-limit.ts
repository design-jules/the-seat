import { createAdminClient } from './supabase/admin'

// Shared daily budget across chat, punch-list, and quick-scan — the three
// routes that call the Anthropic API. Keyed by IP so it works whether or
// not the caller is logged in. Table already resets on a rolling 24h
// window (see supabase/migrations/001_rate_limits.sql), so no schema change.
const DAILY_LIMIT = 80

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean }> {
  const admin = createAdminClient()
  const now = new Date()

  const { data: existing } = await admin
    .from('rate_limits')
    .select('id, message_count, reset_at')
    .eq('ip_address', ip)
    .maybeSingle()

  if (!existing || new Date(existing.reset_at) < now) {
    const resetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    if (existing) {
      await admin.from('rate_limits').update({ message_count: 1, reset_at: resetAt }).eq('id', existing.id)
    } else {
      await admin.from('rate_limits').insert({ ip_address: ip, message_count: 1, reset_at: resetAt })
    }
    return { allowed: true }
  }

  if (existing.message_count >= DAILY_LIMIT) {
    return { allowed: false }
  }

  await admin.from('rate_limits').update({ message_count: existing.message_count + 1 }).eq('id', existing.id)
  return { allowed: true }
}
