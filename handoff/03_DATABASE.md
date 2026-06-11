# Database Schema — The Seat

All tables live in Supabase (Postgres). RLS is enabled on every table.
The service role key (`SUPABASE_SERVICE_ROLE_KEY`) bypasses all RLS — used only in the admin client.

---

## Tables Overview

| Table | Purpose | Key columns |
|---|---|---|
| `sessions` | One row per persona conversation | user_id, persona, training_title, created_at |
| `punch_list_items` | Items in a punch list | session_id, title, detail, priority |
| `approved_users` | Users who have permanent access | user_id, approved_via |
| `access_codes` | Invite codes | code, email (null=unclaimed), note (generic/null) |
| `feedback` | In-app emoji ratings after punch list | rating, comment, session_id |
| `beta_survey` | Full 6-question beta survey responses | persona_hit_hardest, pricing, would_recommend, etc. |
| `rate_limits` | Session/message rate limiting (not yet enforced) | user_id, session_count, reset_at |

---

## Full Migration History

### 001 — Rate Limits
```sql
create table rate_limits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  ip_address text,
  session_count int default 0,
  message_count int default 0,
  reset_at timestamp with time zone default (now() + interval '24 hours'),
  created_at timestamp with time zone default now()
);
alter table rate_limits enable row level security;
create policy "Users can view their own rate limits"
  on rate_limits for select using (auth.uid() = user_id);
```

### 002 — Main Schema
```sql
create table sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  persona text not null check (persona in ('skeptic', 'hype', 'maybe')),
  training_topic text,
  confidence_before int check (confidence_before between -100 and 100),
  confidence_after int check (confidence_after between -100 and 100),
  created_at timestamp with time zone default now()
);

create table punch_list_items (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  item text not null,
  order_index int not null,
  created_at timestamp with time zone default now()
);

alter table sessions enable row level security;
alter table punch_list_items enable row level security;

-- NOTE: These original policies were replaced in migration 008
create policy "Users can manage their own sessions"
  on sessions for all using (auth.uid() = user_id);
create policy "Users can manage their own punch list items"
  on punch_list_items for all using (
    session_id in (select id from sessions where user_id = auth.uid())
  );
```

### 003 — Rename 'maybe' Persona to 'slammed'
```sql
alter table sessions drop constraint sessions_persona_check;
update sessions set persona = 'slammed' where persona = 'maybe';
alter table sessions add constraint sessions_persona_check
  check (persona in ('skeptic', 'hype', 'slammed'));
```

### 004 — Punch List Columns + training_title
```sql
alter table punch_list_items
  add column if not exists title text,
  add column if not exists priority text check (priority in ('DO FIRST', 'DO NEXT', 'NICE TO HAVE')),
  add column if not exists detail text;

alter table sessions
  add column if not exists training_title text;
```

### 005 — Access Codes
```sql
create table if not exists access_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  email text,           -- null = unclaimed, set = claimed by this email
  note text,            -- 'generic' = reusable, null = one-time use
  created_at timestamptz default now(),
  used_at timestamptz
);
alter table access_codes enable row level security;
create policy "Service role full access" on access_codes
  using (true) with check (true);
```

### 006 — Approved Users
```sql
create table if not exists approved_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  approved_via text not null default 'code',
  approved_at timestamptz default now()
);
alter table approved_users enable row level security;
create policy "Users can read own approval" on approved_users
  for select using (auth.uid() = user_id);
create policy "Service role can manage approvals" on approved_users
  for all using (true) with check (true);
```

### 007 — Feedback Table
```sql
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete set null,
  email text,
  rating int check (rating between 1 and 4),  -- 1=😕 2=😐 3=😊 4=🤩
  comment text,
  created_at timestamptz default now()
);
alter table feedback enable row level security;
create policy "Anyone can submit feedback"
  on feedback for insert with check (true);
create policy "Service role reads feedback"
  on feedback for select using (true);
```

### 008 — Fix Sessions RLS (CRITICAL — Run This)
```sql
-- Fixes: NULL = NULL is NULL in Postgres, not TRUE.
-- Old policy blocked all anonymous session inserts.

drop policy if exists "Users can manage their own sessions" on sessions;

create policy "Anyone can insert sessions"
  on sessions for insert with check (true);

create policy "Users can read own sessions"
  on sessions for select using (
    auth.uid() = user_id or user_id is null
  );

create policy "Users can update own sessions"
  on sessions for update using (
    auth.uid() = user_id or user_id is null
  );

drop policy if exists "Users can manage their own punch list items" on punch_list_items;

create policy "Anyone can insert punch list items"
  on punch_list_items for insert with check (true);

create policy "Users can read own punch list items"
  on punch_list_items for select using (
    session_id in (
      select id from sessions
      where user_id = auth.uid() or user_id is null
    )
  );
```

### 009 — Beta Survey (RUN BEFORE SHARING /beta)
```sql
create table if not exists beta_survey (
  id uuid primary key default gen_random_uuid(),
  email text,
  persona_hit_hardest text,   -- 'skeptic' | 'slammed' | 'hype' | 'all'
  after_action text,
  realness int check (realness between 1 and 3),  -- 1=scripted 2=believable 3=uncanny
  improvement text,
  would_recommend text,       -- 'already' | 'yes' | 'probably' | 'later'
  pricing text,               -- 'free' | 'low' | 'mid' | 'high'
  created_at timestamptz default now()
);
alter table beta_survey enable row level security;
create policy "Anyone can submit beta survey"
  on beta_survey for insert with check (true);
create policy "Service role reads beta survey"
  on beta_survey for select using (true);
```

---

## Access Code Logic

Codes in `access_codes` have three states:

| State | note field | email field | Behavior |
|---|---|---|---|
| Generic / reusable | `'generic'` | null | Anyone can use, never consumed. Adds logged-in user to `approved_users`. |
| Unclaimed | anything else / null | null | One-time use. Requires sign-in. Claims to user's account on first use. |
| Claimed | anything else | user's email | Only the matching user can reenter it. |

**Generic codes in use:** TAKEASEAT, SEAT158

---

## Admin Queries (Run in Supabase SQL Editor)

```sql
-- Quick status overview
SELECT
  (SELECT COUNT(*) FROM approved_users) AS have_access,
  (SELECT COUNT(DISTINCT s.user_id) FROM sessions s JOIN approved_users au ON au.user_id = s.user_id) AS activated,
  (SELECT COUNT(*) FROM sessions) AS total_sessions,
  (SELECT COUNT(DISTINCT session_id) FROM punch_list_items) AS punch_lists_generated;
```
