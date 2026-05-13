-- Add priority and title fields to existing punch_list_items table
alter table punch_list_items
  add column if not exists title text,
  add column if not exists priority text check (priority in ('DO FIRST', 'DO NEXT', 'NICE TO HAVE')),
  add column if not exists detail text;

-- Update sessions to use 'slammed' persona (already renamed in 003, this ensures the check constraint is current)
-- Also add training_title for display purposes
alter table sessions
  add column if not exists training_title text;
