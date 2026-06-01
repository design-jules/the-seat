-- Feedback and email capture from punch list completion
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete set null,
  email text,
  rating int check (rating between 1 and 4),   -- 1=😕 2=😐 3=😊 4=🤩
  comment text,
  created_at timestamptz default now()
);

alter table feedback enable row level security;

-- Anyone can insert (anonymous feedback welcome)
create policy "Anyone can submit feedback"
  on feedback for insert with check (true);

-- Service role reads all
create policy "Service role reads feedback"
  on feedback for select using (true);
