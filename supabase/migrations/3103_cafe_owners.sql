-- Links users to cafes they own/manage
create table cafe_owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  cafe_id uuid references cafes(id) on delete cascade not null,
  role text not null default 'owner' check (role in ('owner', 'manager')),
  created_at timestamptz default now(),
  UNIQUE (user_id, cafe_id)
);

create index idx_cafe_owners_user on cafe_owners(user_id);
create index idx_cafe_owners_cafe on cafe_owners(cafe_id);

-- RLS
alter table cafe_owners enable row level security;

create policy "Users can read own entries"
  on cafe_owners for select
  using (user_id = auth.uid());

create policy "Admin can manage"
  on cafe_owners for all
  using (exists (select 1 from profiles where id = auth.uid() and is_moderator = true));
