# Analytics & User Intelligence — Design Spec

## Overview

Implement comprehensive analytics tracking across the cafes-seoul app to understand user behavior, generate insights for cafe owners, and enable personalized recommendations. Dual storage: Vercel Analytics for real-time monitoring + Supabase for deep analysis with user/cafe joins.

---

## 1. Cookie Consent (Revamped)

### Current State
Simple banner with "Accept" button, no granularity, Vercel Analytics loads regardless.

### New Design
- **Default view**: Short explanatory text + "Accepter" button (all toggles ON by default)
- **"Modifier les cookies" link**: Expands to show toggles
  - **Essentiel** (always on, grayed out) — language preference, session
  - **Analytics** — event tracking, browser language, device type
  - **Localisation** — geolocation via navigator API
- **No "Refuse" button** — user unchecks what they want to disable, then accepts
- Cookie `cookie-consent` stores granular choices as JSON: `{essential: true, analytics: true, location: true}`
- All tracking code checks consent before firing

---

## 2. Geolocation

- Triggered only after "Localisation" consent is granted
- `navigator.geolocation.getCurrentPosition()` called once on consent, then on demand
- **Client-side**: Exact position used for proximity sorting via existing `find_cafes_nearby` RPC
- **Server-side storage**: Position rounded to 3 decimal places (~110m precision) in `analytics_events`
- District name derived from coordinates (reverse geocoding via Kakao Maps API)

---

## 3. Database Schema

### Table: `analytics_events`

```sql
create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,  -- nullable for anonymous users
  session_id text not null,
  event_type text not null,
  event_data jsonb default '{}',
  page_path text,
  referrer_page text,
  latitude numeric,              -- rounded to 3 decimals if location consent
  longitude numeric,
  district text,                 -- derived from coordinates
  browser_language text,         -- navigator.language
  device_type text,              -- mobile/desktop/tablet
  created_at timestamptz default now()
);

create index idx_analytics_event_type on analytics_events(event_type);
create index idx_analytics_user on analytics_events(user_id);
create index idx_analytics_created on analytics_events(created_at);
create index idx_analytics_session on analytics_events(session_id);
create index idx_analytics_cafe on analytics_events using gin ((event_data->'cafe_id'));
```

### Table: `cafe_monthly_stats`

Pre-aggregated monthly KPIs per cafe, computed by a cron job on the 1st of each month.

```sql
create table cafe_monthly_stats (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid references cafes(id) on delete cascade not null,
  month date not null,                    -- first day of month (e.g., 2026-03-01)
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
  top_filters_missed jsonb default '[]',     -- [{filter, value, count}]
  competitor_cafes jsonb default '[]',        -- [{cafe_id, co_view_count}]
  visitor_languages jsonb default '{}',       -- {ko: 45, en: 30, ...}
  visitor_devices jsonb default '{}',         -- {mobile: 60, desktop: 40}
  peak_search_hours jsonb default '[]',       -- [{hour, count}]
  district_rank integer,                      -- rank vs other cafes in same district
  rating_avg numeric,
  new_ratings_count integer default 0,
  new_favorites_count integer default 0,
  roulette_appearances integer default 0,
  roulette_accepts integer default 0,
  unique constraint (cafe_id, month)
);

create index idx_monthly_stats_cafe on cafe_monthly_stats(cafe_id);
create index idx_monthly_stats_month on cafe_monthly_stats(month);
```

### Table: `cafe_owners`

Links users to cafes they own/manage. Enables pro dashboard access.

```sql
create table cafe_owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  cafe_id uuid references cafes(id) on delete cascade not null,
  role text not null default 'owner' check (role in ('owner', 'manager')),
  created_at timestamptz default now(),
  unique (user_id, cafe_id)
);

create index idx_cafe_owners_user on cafe_owners(user_id);
create index idx_cafe_owners_cafe on cafe_owners(cafe_id);
```

### Profile update

Add `is_pro boolean default false` to `profiles` table.

### RLS Policies

```sql
-- analytics_events: insert only (no read for regular users, admin can read all)
alter table analytics_events enable row level security;
create policy "Anyone can insert events" on analytics_events for insert with check (true);
create policy "Admin can read all events" on analytics_events for select using (
  exists (select 1 from profiles where id = auth.uid() and is_moderator = true)
);

-- cafe_monthly_stats: owners/managers can read their own cafe stats
alter table cafe_monthly_stats enable row level security;
create policy "Cafe owners can read their stats" on cafe_monthly_stats for select using (
  exists (select 1 from cafe_owners where cafe_owners.cafe_id = cafe_monthly_stats.cafe_id and cafe_owners.user_id = auth.uid())
);
create policy "Admin can read all stats" on cafe_monthly_stats for select using (
  exists (select 1 from profiles where id = auth.uid() and is_moderator = true)
);

-- cafe_owners: users can read their own entries, admin can manage
alter table cafe_owners enable row level security;
create policy "Users can read own entries" on cafe_owners for select using (user_id = auth.uid());
create policy "Admin can manage" on cafe_owners for all using (
  exists (select 1 from profiles where id = auth.uid() and is_moderator = true)
);
```

---

## 4. Events Catalog

### Navigation & Parcours

| Event Type | event_data | Description |
|---|---|---|
| `page_view` | `{path, referrer}` | Every page navigation |
| `cafe_view` | `{cafe_id, slug, source: "map"\|"list"\|"roulette"\|"similar"}` | Cafe detail page opened |
| `cafe_view_duration` | `{cafe_id, duration_seconds, scroll_depth_percent}` | Sent on page leave |
| `cafe_bounce` | `{cafe_id, time_on_page, last_section_viewed}` | Left quickly (<10s) |

### Search & Filters

| Event Type | event_data | Description |
|---|---|---|
| `search_text` | `{query, result_count, page: "home"\|"cafes"}` | Text search input |
| `filter_apply` | `{filters: {...}, result_count}` | Filter combination applied |
| `search_no_results` | `{filters, district, station, query}` | Search returned 0 results |
| `station_select` | `{station_id, station_name, radius}` | Metro station selected |

### Map Interactions (debounced 500ms)

| Event Type | event_data | Description |
|---|---|---|
| `marker_click` | `{cafe_id, zoom_level}` | Clicked cafe marker |
| `map_viewport` | `{center_lat, center_lng, zoom, visible_cafes_count}` | Viewport settled |
| `map_zoom` | `{from_level, to_level}` | Zoom change |
| `map_pan` | `{center_lat, center_lng}` | Map panned to new center |

### Funnel & Conversion

| Event Type | event_data | Description |
|---|---|---|
| `cafe_impression` | `{cafe_id, context: "list"\|"map"\|"roulette", position_in_list}` | Cafe visible on screen |
| `directions_click` | `{cafe_id, source: "detail"\|"map_popup"}` | Clicked directions CTA |
| `cta_click` | `{cafe_id, cta_type: "website"\|"social"\|"phone"}` | Clicked non-directions CTA |
| `outbound_click` | `{cafe_id, url, link_type: "instagram"\|"naver"\|"website"}` | Clicked external link |
| `cafe_share` | `{cafe_id, method: "copy_link"\|"kakao"\|"native"}` | Shared cafe |

### Engagement

| Event Type | event_data | Description |
|---|---|---|
| `favorite_toggle` | `{cafe_id, action: "add"\|"remove"}` | Toggled favorite |
| `rating_submit` | `{cafe_id, overall, dimensions_filled}` | Submitted rating |
| `photo_view` | `{cafe_id, photo_id, view_duration, position_in_gallery}` | Viewed photo |
| `photo_swipe_depth` | `{cafe_id, total_photos, max_viewed}` | Max photos viewed in gallery |

### Comparative Behavior

| Event Type | event_data | Description |
|---|---|---|
| `cafe_compare_session` | `{cafes_viewed: [...], chosen: id}` | Session cafe comparison |
| `filter_miss` | `{cafe_id, filter_name, filter_value}` | Cafe didn't match active filter |
| `repeat_view` | `{cafe_id, view_count, days_between}` | Returning to same cafe page |

### Roulette

| Event Type | event_data | Description |
|---|---|---|
| `roulette_spin` | `{filters_applied, result_cafe_id}` | Roulette spun |
| `roulette_accept` | `{cafe_id}` | Accepted roulette result |
| `roulette_respin` | `{rejected_cafe_id}` | Rejected and respun |

### Auth

| Event Type | event_data | Description |
|---|---|---|
| `signup` | `{method: "email"\|"google"\|"kakao"}` | User registered |
| `login` | `{method}` | User logged in |

---

## 5. Client Architecture

### `useAnalytics()` Hook

Central tracking hook used across the app.

```typescript
interface AnalyticsHook {
  // Core
  track(eventType: string, data?: Record<string, unknown>): void;
  checkConsent(type: 'analytics' | 'location'): boolean;

  // Specialized hooks (composed internally)
  usePageView(): void;                              // auto page_view on route change
  useMapTracking(): MapTrackingHandlers;             // debounced map events
  useCafeViewTracking(cafeId: string): void;         // duration + scroll + bounce
  useImpressionTracking(cafeId: string): RefObject;  // intersection observer
  useCompareSession(): void;                         // accumulates cafes viewed
}
```

### Tracking Flow

1. `track()` checks consent cookie
2. If analytics consent: sends to Vercel (`track()` from `@vercel/analytics`) + Supabase (server action)
3. Session ID generated on mount, stored in `sessionStorage`
4. Browser language + device type captured once per session
5. Location (if consented) attached to events

### Server Action: `trackEvent()`

```typescript
// src/lib/actions/analytics.ts
'use server'
async function trackEvent(event: {
  eventType: string;
  eventData?: Record<string, unknown>;
  pagePath?: string;
  referrerPage?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  browserLanguage?: string;
  deviceType?: string;
  sessionId: string;
}): Promise<void>
```

- Inserts into `analytics_events`
- Attaches `user_id` from auth session (if logged in)
- Fire-and-forget (don't await on client for UX)

---

## 6. Implicit Preferences

### RPC: `get_user_preferences(p_user_id uuid)`

Calculates user taste profile on-demand from:

1. **Ratings given** (weight: 3) — explicit preferences
2. **Favorited cafes** (weight: 2) — curated preference
3. **Most viewed cafes** (weight: 1) — implicit interest via `analytics_events`

Returns weighted average scores (0-10) for each dimension:
- coffee, wifi, price_value, quietness, seating, comfort, food, lighting, outlets
- Plus boolean tendencies: pet_friendly, laptop_friendly

Can be upgraded to a materialized table (`user_preferences`) later if performance requires it.

---

## 7. Share Button (New Component)

Add share button to cafe detail page:
- **Copy link** — copies cafe URL to clipboard
- **Kakao** — Kakao Share API (already have Kakao SDK loaded for maps)
- **Native** — Web Share API (`navigator.share`) on supported devices
- Tracks `cafe_share` event with method

---

## 8. Monthly Stats Aggregation

### Cron Job (Supabase Edge Function)

Runs on the 1st of each month. For each cafe:

1. Query `analytics_events` for the previous month
2. Aggregate all KPIs (impressions, clicks, directions, shares, etc.)
3. Calculate CTR, bounce rate, avg view duration
4. Identify top missed filters, competitor cafes, visitor languages/devices
5. Calculate district rank
6. Insert/upsert into `cafe_monthly_stats`

### Schedule

- Supabase `pg_cron` or Edge Function with cron trigger
- Runs at `0 2 1 * *` (2 AM on 1st of each month)

---

## 9. Pro Cafe Owner Access (Schema Only)

### Prepared in this implementation:
- `cafe_owners` table with RLS
- `is_pro` field on `profiles`
- RLS on `cafe_monthly_stats` restricting to cafe owners

### Out of scope (future):
- `/pro` route with dashboard UI
- Line charts showing monthly stat trends
- Month-over-month comparison with deltas
- Admin UI to assign cafe owners and pro status

---

## 10. Privacy & Data Considerations

- **No exact coordinates stored server-side** — rounded to 3 decimals (~110m)
- **Anonymous tracking** — `user_id` is nullable, anonymous users get session-level tracking only
- **Consent-gated** — all non-essential tracking requires explicit consent
- **Data retention** — `analytics_events` can be pruned after aggregation into monthly stats (policy TBD)
- **User deletion** — `on delete set null` on `user_id` preserves anonymous aggregate data
- **GDPR export** — events can be queried by `user_id` for data export requests

---

## 11. Scope Summary

### Implemented Now
- [x] Cookie consent revamp (granular toggles)
- [x] `analytics_events` table + RLS
- [x] `useAnalytics()` hook with consent checking
- [x] All event tracking (30 event types)
- [x] Geolocation with consent
- [x] Browser language + device type detection
- [x] Implicit preferences RPC
- [x] Share button component
- [x] `cafe_monthly_stats` table
- [x] `cafe_owners` table + `is_pro` profile field
- [x] Monthly aggregation cron job

### Future (Out of Scope)
- [ ] Pro dashboard UI with line charts
- [ ] "Recent searches" UI component
- [ ] Realtime presence (WebSocket)
- [ ] Data retention/pruning policy
- [ ] Admin UI for cafe owner management
