-- Pre-aggregated monthly KPIs per cafe
create table cafe_monthly_stats (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid references cafes(id) on delete cascade not null,
  month date not null,
  impressions integer default 0,
  clicks integer default 0,
  ctr numeric generated always as (
    case when impressions > 0 then clicks::numeric / impressions else 0 end
  ) stored,
  directions_clicks integer default 0,
  outbound_clicks integer default 0,
  shares integer default 0,
  avg_view_duration numeric default 0,
  bounce_rate numeric default 0,
  unique_visitors integer default 0,
  repeat_visitors integer default 0,
  top_filters_missed jsonb default '[]',
  competitor_cafes jsonb default '[]',
  visitor_languages jsonb default '{}',
  visitor_devices jsonb default '{}',
  peak_search_hours jsonb default '[]',
  district_rank integer,
  rating_avg numeric,
  new_ratings_count integer default 0,
  new_favorites_count integer default 0,
  roulette_appearances integer default 0,
  roulette_accepts integer default 0,
  UNIQUE (cafe_id, month)
);

create index idx_monthly_stats_cafe on cafe_monthly_stats(cafe_id);
create index idx_monthly_stats_month on cafe_monthly_stats(month);

-- RLS
alter table cafe_monthly_stats enable row level security;

create policy "Cafe owners can read their stats"
  on cafe_monthly_stats for select
  using (exists (
    select 1 from cafe_owners
    where cafe_owners.cafe_id = cafe_monthly_stats.cafe_id
    and cafe_owners.user_id = auth.uid()
  ));

create policy "Admin can read all stats"
  on cafe_monthly_stats for select
  using (exists (select 1 from profiles where id = auth.uid() and is_moderator = true));
