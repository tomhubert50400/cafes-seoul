-- Analytics events table for tracking user behavior
create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text not null,
  event_type text not null,
  event_data jsonb default '{}',
  page_path text,
  referrer_page text,
  latitude numeric,
  longitude numeric,
  district text,
  browser_language text,
  device_type text,
  created_at timestamptz default now()
);

create index idx_analytics_event_type_created on analytics_events(event_type, created_at);
create index idx_analytics_user on analytics_events(user_id);
create index idx_analytics_session on analytics_events(session_id);
create index idx_analytics_cafe on analytics_events ((event_data->>'cafe_id'));

-- RLS: no public access. Inserts via service role. Admin read only.
alter table analytics_events enable row level security;

create policy "Admin can read all events"
  on analytics_events for select
  using (exists (select 1 from profiles where id = auth.uid() and is_moderator = true));
