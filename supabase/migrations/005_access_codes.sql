create table if not exists access_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  email text,
  note text,
  created_at timestamptz default now(),
  used_at timestamptz
);

-- Only service role can insert/update, anyone can read (for validation)
alter table access_codes enable row level security;

create policy "Service role full access" on access_codes
  using (true)
  with check (true);
