# Environment Variables — The Seat

All environment variables required to run the project locally and in production.

---

## Required Variables

### Supabase

```
NEXT_PUBLIC_SUPABASE_URL
```
The Supabase project URL. Found in Supabase dashboard: Settings > API.
`https://[project-id].supabase.co`

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
The public anon key. Used in browser-side Supabase clients.
Safe to expose — RLS policies control what this key can access.

```
SUPABASE_SERVICE_ROLE_KEY
```
The service role key. **Never expose to the browser.** Bypasses all RLS.
Used only in `lib/supabase/admin.ts` for the admin dashboard.
Found in Supabase dashboard: Settings > API > Service Role Key.

---

### Anthropic (Claude)

```
ANTHROPIC_API_KEY
```
API key for the Anthropic Claude API (claude-opus-4-5).
Used in all three AI routes: `/api/quick-scan`, `/api/chat`, `/api/punch-list`.
Found at: console.anthropic.com > API Keys.

---

### Admin Dashboard

```
ADMIN_SECRET
```
Secret string used to protect the `/admin` dashboard.
Access is granted via `?key=ADMIN_SECRET` query param.
Set to any strong random string. Keep this private.

---

### Stripe

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```
Stripe publishable key. Used client-side in the checkout flow.
Safe to expose to browser.

```
STRIPE_SECRET_KEY
```
Stripe secret key. Used server-side in `/api/create-checkout` and `/api/verify-payment`.
Never expose to the browser.

```
STRIPE_PRICE_ID
```
The Stripe Price ID for the $19/session product.
Format: `price_xxxxxxxxxxxxxxxx`
Found in Stripe dashboard: Products > [product] > Pricing.

---

### PostHog Analytics

```
NEXT_PUBLIC_POSTHOG_KEY
```
PostHog project API key.
Used in `app/providers.tsx` to initialize PostHog.

```
NEXT_PUBLIC_POSTHOG_HOST
```
PostHog host URL. Defaults to `https://us.i.posthog.com` if not set.

---

## Local Development

Create a `.env.local` file in the project root with all the above variables.
This file is gitignored and should never be committed.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_SECRET=your-secret-here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Vercel Production

All variables must be added in Vercel: Project Settings > Environment Variables.

Variables prefixed `NEXT_PUBLIC_` are available in browser bundles.
Variables without that prefix are server-only.

**Never add `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, or `STRIPE_SECRET_KEY` as `NEXT_PUBLIC_` — these would be exposed in the browser.**

---

## Variable Summary

| Variable | Exposed to Browser | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Yes (admin only) |
| `ANTHROPIC_API_KEY` | No | Yes |
| `ADMIN_SECRET` | No | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Yes (when Stripe active) |
| `STRIPE_SECRET_KEY` | No | Yes (when Stripe active) |
| `STRIPE_PRICE_ID` | No | Yes (when Stripe active) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Yes | Yes |
| `NEXT_PUBLIC_POSTHOG_HOST` | Yes | No (has default) |
