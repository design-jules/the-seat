create table if not exists beta_survey (
  id uuid primary key default gen_random_uuid(),
  email text,
  persona_hit_hardest text,   -- 'skeptic' | 'slammed' | 'hype' | 'all'
  after_action text,           -- what they did after
  realness int check (realness between 1 and 3),  -- 1=scripted 2=believable 3=uncanny
  improvement text,            -- open text
  would_recommend text,        -- 'already' | 'yes' | 'probably' | 'later'
  pricing text,                -- 'free' | 'low' | 'mid' | 'high'
  created_at timestamptz default now()
);

alter table beta_survey enable row level security;

-- Anyone can submit
create policy "Anyone can submit beta survey"
  on beta_survey for insert with check (true);

-- Service role reads all
create policy "Service role reads beta survey"
  on beta_survey for select using (true);
