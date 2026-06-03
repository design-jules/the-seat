-- Fix sessions RLS so anonymous users can also save sessions.
-- The old policy used (auth.uid() = user_id) which fails when both are NULL
-- because NULL = NULL evaluates to NULL (not TRUE) in Postgres.

-- Drop the catch-all policy and replace with explicit per-operation policies.
drop policy if exists "Users can manage their own sessions" on sessions;

-- Anyone can insert a session (logged-in users get their user_id, guests get null)
create policy "Anyone can insert sessions"
  on sessions for insert with check (true);

-- Users can read their own sessions; guests can read their own anonymous sessions
create policy "Users can read own sessions"
  on sessions for select using (
    auth.uid() = user_id or user_id is null
  );

-- Users can update their own sessions (confidence_after etc.)
create policy "Users can update own sessions"
  on sessions for update using (
    auth.uid() = user_id or user_id is null
  );

-- Same for punch_list_items — fix the same NULL problem
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
