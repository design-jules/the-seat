create table if not exists approved_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  approved_via text not null default 'code',
  approved_at timestamptz default now()
);

alter table approved_users enable row level security;

-- Users can read their own row
create policy "Users can read own approval" on approved_users
  for select using (auth.uid() = user_id);

-- Service role can insert/update
create policy "Service role can manage approvals" on approved_users
  for all using (true) with check (true);
