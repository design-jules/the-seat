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
