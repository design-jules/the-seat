-- Sessions table
create table sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  persona text not null check (persona in ('skeptic', 'hype', 'maybe')),
  training_topic text,
  confidence_before int check (confidence_before between -100 and 100),
  confidence_after int check (confidence_after between -100 and 100),
  created_at timestamp with time zone default now()
);

-- Punch list items table
create table punch_list_items (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  item text not null,
  order_index int not null,
  created_at timestamp with time zone default now()
);

-- Row level security
alter table sessions enable row level security;
alter table punch_list_items enable row level security;

-- Policies
create policy "Users can manage their own sessions"
  on sessions for all using (auth.uid() = user_id);

create policy "Users can manage their own punch list items"
  on punch_list_items for all using (
    session_id in (select id from sessions where user_id = auth.uid())
  );
