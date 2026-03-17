# Analytics & User Intelligence Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement comprehensive analytics tracking across the app with cookie consent, event collection, geolocation, implicit preferences, share button, and monthly aggregation for cafe owners.

**Architecture:** Three-layer approach: (1) Database layer with `analytics_events`, `cafe_monthly_stats`, `cafe_owners` tables + RLS, (2) Server action `trackEvent()` using service role client for inserts, (3) Client `useAnalytics()` hook with consent gating, session management, and specialized sub-hooks for different tracking contexts. All tracking is fire-and-forget to avoid impacting UX.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL + Edge Functions + pg_cron), React 19, TypeScript, Vercel Analytics, Kakao Maps API (reverse geocoding), IntersectionObserver API, Web Share API.

**Spec:** `docs/superpowers/specs/2026-03-14-analytics-user-intelligence-design.md`

---

## Chunk 1: Database Foundation

### Task 1: Analytics Events Migration

**Files:**
- Create: `supabase/migrations/3101_analytics_events.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Apply migration**

Run: `npx supabase db push` or apply via Supabase MCP tool.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/3101_analytics_events.sql
git commit -m "feat: add analytics_events table with indexes and RLS"
```

---

### Task 2: Cafe Monthly Stats Migration

**Files:**
- Create: `supabase/migrations/3102_cafe_monthly_stats.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Apply migration**

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/3102_cafe_monthly_stats.sql
git commit -m "feat: add cafe_monthly_stats table with RLS"
```

---

### Task 3: Cafe Owners Migration

**Files:**
- Create: `supabase/migrations/3103_cafe_owners.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Apply migration**

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/3103_cafe_owners.sql
git commit -m "feat: add cafe_owners table with RLS"
```

---

### Task 4: Profile is_pro Column

**Files:**
- Create: `supabase/migrations/3104_profile_is_pro.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Add is_pro flag for subscription/billing
alter table profiles add column if not exists is_pro boolean default false;
```

- [ ] **Step 2: Apply migration**

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/3104_profile_is_pro.sql
git commit -m "feat: add is_pro column to profiles"
```

---

### Task 5: Data Retention Cron Job

**Files:**
- Create: `supabase/migrations/3105_analytics_retention_cron.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Prune analytics events older than 13 months (monthly)
select cron.schedule(
  'prune-analytics-events',
  '0 3 1 * *',  -- 3 AM on 1st of each month
  $$DELETE FROM analytics_events WHERE created_at < now() - interval '13 months'$$
);
```

- [ ] **Step 2: Apply migration**

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/3105_analytics_retention_cron.sql
git commit -m "feat: add analytics data retention cron (13 months)"
```

---

### Task 6: Analytics Types

**Files:**
- Create: `src/types/analytics.ts`
- Modify: `src/types/index.ts` — add export

- [ ] **Step 1: Create the types file**

```typescript
// src/types/analytics.ts

export type ConsentChoices = {
  essential: true; // always true
  analytics: boolean;
  location: boolean;
};

export type DeviceType = 'mobile' | 'desktop' | 'tablet';

export type EventType =
  // Navigation
  | 'page_view'
  | 'cafe_view'
  | 'cafe_view_duration'
  // Search & Filters
  | 'search_text'
  | 'filter_apply'
  | 'search_no_results'
  | 'station_select'
  // Map
  | 'marker_click'
  | 'map_viewport'
  // Funnel & Conversion
  | 'cafe_impression'
  | 'directions_click'
  | 'cta_click'
  | 'outbound_click'
  | 'cafe_share'
  // Engagement
  | 'favorite_toggle'
  | 'rating_submit'
  | 'photo_view'
  | 'photo_swipe_depth'
  // Comparative
  | 'cafe_compare_session'
  | 'repeat_view'
  // Roulette
  | 'roulette_spin'
  | 'roulette_accept'
  | 'roulette_respin'
  // Auth
  | 'signup'
  | 'login';

export interface TrackEventPayload {
  eventType: EventType;
  eventData?: Record<string, unknown>;
  pagePath?: string;
  referrerPage?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  browserLanguage?: string;
  deviceType?: DeviceType;
  sessionId: string;
}
```

- [ ] **Step 2: Add export to barrel file**

Add to `src/types/index.ts`:
```typescript
export * from './analytics';
```

- [ ] **Step 3: Commit**

```bash
git add src/types/analytics.ts src/types/index.ts
git commit -m "feat: add analytics types (events, consent, payload)"
```

---

### Task 7: Server Action — trackEvent

**Files:**
- Create: `src/lib/actions/analytics.ts`

- [ ] **Step 1: Create the server action**

```typescript
// src/lib/actions/analytics.ts
'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { TrackEventPayload } from '@/types/analytics';

/**
 * Track an analytics event.
 * Uses service role client to bypass RLS (no public INSERT policy).
 * Attaches user_id from session if logged in.
 * Fire-and-forget on client side — errors are logged, not surfaced.
 */
export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  try {
    // Get user_id if logged in (optional — anonymous tracking allowed)
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Not logged in — that's fine
    }

    const serviceClient = createServiceRoleClient();

    await serviceClient.from('analytics_events').insert({
      user_id: userId,
      session_id: payload.sessionId,
      event_type: payload.eventType,
      event_data: payload.eventData ?? {},
      page_path: payload.pagePath,
      referrer_page: payload.referrerPage,
      latitude: payload.latitude,
      longitude: payload.longitude,
      district: payload.district,
      browser_language: payload.browserLanguage,
      device_type: payload.deviceType,
    });
  } catch (err) {
    // Fire-and-forget — log but don't throw
    console.error('[Analytics] Failed to track event:', err);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/analytics.ts
git commit -m "feat: add trackEvent server action with service role insert"
```

---

## Chunk 2: Cookie Consent & Analytics Hook

### Task 8: Cookie Consent Revamp

**Files:**
- Modify: `src/components/cookie-consent.tsx` — rewrite with granular toggles
- Modify: `src/lib/i18n/locales/en.ts` — add new translation keys
- Modify: `src/lib/i18n/locales/ko.ts`
- Modify: `src/lib/i18n/locales/fr.ts`
- Modify: `src/lib/i18n/locales/zh.ts`
- Modify: `src/lib/i18n/locales/vi.ts`

- [ ] **Step 1: Add translation keys**

Add before the closing `};` in each locale file. Keys to add:

```typescript
// English (en.ts)
'cookies.message': 'We use cookies and similar technologies to improve your experience.',
'cookies.settings': 'Settings',
'cookies.accept': 'Accept',
'cookies.essential': 'Essential',
'cookies.essentialDesc': 'Language preference, session',
'cookies.analyticsLabel': 'Analytics',
'cookies.analyticsDesc': 'Usage statistics to improve the site',
'cookies.locationLabel': 'Location',
'cookies.locationDesc': 'Find cafes near you',
'cookies.learnMore': 'Learn more',
```

Korean (ko.ts):
```typescript
'cookies.message': '경험을 개선하기 위해 쿠키 및 유사 기술을 사용합니다.',
'cookies.settings': '설정',
'cookies.accept': '수락',
'cookies.essential': '필수',
'cookies.essentialDesc': '언어 설정, 세션',
'cookies.analyticsLabel': '분석',
'cookies.analyticsDesc': '사이트 개선을 위한 사용 통계',
'cookies.locationLabel': '위치',
'cookies.locationDesc': '근처 카페 찾기',
'cookies.learnMore': '자세히 보기',
```

French (fr.ts):
```typescript
'cookies.message': 'Nous utilisons des cookies et technologies similaires pour améliorer votre expérience.',
'cookies.settings': 'Paramètres',
'cookies.accept': 'Accepter',
'cookies.essential': 'Essentiels',
'cookies.essentialDesc': 'Préférence de langue, session',
'cookies.analyticsLabel': 'Analytique',
'cookies.analyticsDesc': 'Statistiques pour améliorer le site',
'cookies.locationLabel': 'Localisation',
'cookies.locationDesc': 'Trouver des cafés près de vous',
'cookies.learnMore': 'En savoir plus',
```

Chinese (zh.ts):
```typescript
'cookies.message': '我们使用 Cookie 和类似技术来改善您的体验。',
'cookies.settings': '设置',
'cookies.accept': '接受',
'cookies.essential': '必需',
'cookies.essentialDesc': '语言偏好、会话',
'cookies.analyticsLabel': '分析',
'cookies.analyticsDesc': '改善网站的使用统计',
'cookies.locationLabel': '位置',
'cookies.locationDesc': '查找附近的咖啡馆',
'cookies.learnMore': '了解更多',
```

Vietnamese (vi.ts):
```typescript
'cookies.message': 'Chung toi su dung cookie va cong nghe tuong tu de cai thien trai nghiem cua ban.',
'cookies.settings': 'Cai dat',
'cookies.accept': 'Chap nhan',
'cookies.essential': 'Thiet yeu',
'cookies.essentialDesc': 'Tuy chon ngon ngu, phien',
'cookies.analyticsLabel': 'Phan tich',
'cookies.analyticsDesc': 'Thong ke su dung de cai thien trang web',
'cookies.locationLabel': 'Vi tri',
'cookies.locationDesc': 'Tim quan ca phe gan ban',
'cookies.learnMore': 'Tim hieu them',
```

- [ ] **Step 2: Commit translation keys**

```bash
git add src/lib/i18n/locales/en.ts src/lib/i18n/locales/ko.ts src/lib/i18n/locales/fr.ts src/lib/i18n/locales/zh.ts src/lib/i18n/locales/vi.ts
git commit -m "feat: add granular cookie consent translation keys (5 languages)"
```

- [ ] **Step 3: Rewrite cookie consent component**

Replace `src/components/cookie-consent.tsx` with:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/lib/i18n';
import { isNativePlatform } from '@/lib/capacitor/platform';
import type { ConsentChoices } from '@/types/analytics';

const COOKIE_NAME = 'cookie-consent';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export function getConsentChoices(): ConsentChoices | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split('=')[1]));
  } catch {
    // Legacy format (just "accepted") — treat as all consented
    return { essential: true, analytics: true, location: true };
  }
}

export function hasAnalyticsConsent(): boolean {
  return getConsentChoices()?.analytics ?? false;
}

export function hasLocationConsent(): boolean {
  return getConsentChoices()?.location ?? false;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [location, setLocation] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    if (isNativePlatform()) return;
    const existing = getConsentChoices();
    if (!existing) {
      setVisible(true);
    }
  }, []);

  const accept = useCallback(() => {
    const choices: ConsentChoices = {
      essential: true,
      analytics,
      location,
    };
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(choices))}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    setVisible(false);
  }, [analytics, location]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm p-4 shadow-lg">
      <div className="mx-auto max-w-4xl space-y-3">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            {t('cookies.message')}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings((s) => !s)}
            >
              {t('cookies.settings')}
            </Button>
            <Button size="sm" onClick={accept}>
              {t('cookies.accept')}
            </Button>
          </div>
        </div>

        {showSettings && (
          <div className="space-y-2 border-t pt-3">
            {/* Essential — always on */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t('cookies.essential')}</p>
                <p className="text-xs text-muted-foreground">{t('cookies.essentialDesc')}</p>
              </div>
              <Switch checked disabled />
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t('cookies.analyticsLabel')}</p>
                <p className="text-xs text-muted-foreground">{t('cookies.analyticsDesc')}</p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} />
            </div>

            {/* Location */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t('cookies.locationLabel')}</p>
                <p className="text-xs text-muted-foreground">{t('cookies.locationDesc')}</p>
              </div>
              <Switch checked={location} onCheckedChange={setLocation} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/cookie-consent.tsx
git commit -m "feat: revamp cookie consent with granular analytics/location toggles"
```

---

### Task 9: useAnalytics Hook — Core

**Files:**
- Create: `src/hooks/use-analytics.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/hooks/use-analytics.ts
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/actions/analytics';
import { hasAnalyticsConsent, hasLocationConsent, getConsentChoices } from '@/components/cookie-consent';
import type { EventType, DeviceType, TrackEventPayload } from '@/types/analytics';

function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return 'ssr';
  let id = sessionStorage.getItem('analytics_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', id);
  }
  return id;
}

function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  return navigator.language;
}

// Shared location cache (resolved once per session)
let cachedLocation: { latitude: number; longitude: number; district?: string } | null = null;
let locationPromise: Promise<typeof cachedLocation> | null = null;

function getLocation(): Promise<typeof cachedLocation> {
  if (cachedLocation) return Promise.resolve(cachedLocation);
  if (locationPromise) return locationPromise;
  if (!hasLocationConsent()) return Promise.resolve(null);
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);

  locationPromise = new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cachedLocation = {
          latitude: Math.round(pos.coords.latitude * 1000) / 1000,
          longitude: Math.round(pos.coords.longitude * 1000) / 1000,
        };
        resolve(cachedLocation);
      },
      () => resolve(null),
      { timeout: 5000, maximumAge: 300000 }
    );
  });

  return locationPromise;
}

export function useAnalytics() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const sessionMetaRef = useRef<{ browserLanguage: string; deviceType: DeviceType } | null>(null);

  // Cache session metadata once
  useEffect(() => {
    if (!sessionMetaRef.current) {
      sessionMetaRef.current = {
        browserLanguage: getBrowserLanguage(),
        deviceType: getDeviceType(),
      };
    }
  }, []);

  const track = useCallback(
    async (eventType: EventType, eventData?: Record<string, unknown>) => {
      if (!hasAnalyticsConsent()) return;

      const location = await getLocation();
      const meta = sessionMetaRef.current;

      const payload: TrackEventPayload = {
        eventType,
        eventData,
        pagePath: pathname,
        referrerPage: prevPathRef.current ?? undefined,
        sessionId: getSessionId(),
        browserLanguage: meta?.browserLanguage,
        deviceType: meta?.deviceType,
        latitude: location?.latitude,
        longitude: location?.longitude,
        district: location?.district,
      };

      // Fire-and-forget
      trackEvent(payload).catch(() => {});
    },
    [pathname]
  );

  // Auto page_view on route change
  useEffect(() => {
    if (pathname && pathname !== prevPathRef.current) {
      track('page_view', { path: pathname, referrer: prevPathRef.current });
      prevPathRef.current = pathname;
    }
  }, [pathname, track]);

  const checkConsent = useCallback(
    (type: 'analytics' | 'location'): boolean => {
      const choices = getConsentChoices();
      if (!choices) return false;
      return type === 'analytics' ? choices.analytics : choices.location;
    },
    []
  );

  return { track, checkConsent };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-analytics.ts
git commit -m "feat: add useAnalytics hook with consent checking and auto page_view"
```

---

### Task 10: Analytics Provider (wrap app)

**Files:**
- Create: `src/components/analytics-provider.tsx`
- Modify: `src/app/layout.tsx` — add provider

- [ ] **Step 1: Create the provider**

This thin wrapper just mounts `useAnalytics` at the app root so page_view tracking runs globally.

```typescript
// src/components/analytics-provider.tsx
'use client';

import { useAnalytics } from '@/hooks/use-analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useAnalytics(); // mounts auto page_view tracking
  return <>{children}</>;
}
```

- [ ] **Step 2: Add to layout.tsx**

In `src/app/layout.tsx`, import and wrap children:

```typescript
import { AnalyticsProvider } from '@/components/analytics-provider';
```

Wrap the `<div id="main-content">` block:

```tsx
<AuthPromptProvider>
  <AnalyticsProvider>
    <div id="main-content">
      {children}
    </div>
  </AnalyticsProvider>
  <Toaster position="top-right" richColors closeButton />
  <CookieConsent />
</AuthPromptProvider>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/analytics-provider.tsx src/app/layout.tsx
git commit -m "feat: add AnalyticsProvider to root layout for auto page_view"
```

---

## Chunk 3: Specialized Tracking Hooks

### Task 11: Cafe View Duration Tracking

**Files:**
- Create: `src/hooks/use-cafe-view-tracking.ts`

- [ ] **Step 1: Create the hook**

Tracks how long a user stays on a cafe page + scroll depth. Fires `cafe_view` on mount and `cafe_view_duration` on unmount.

```typescript
// src/hooks/use-cafe-view-tracking.ts
'use client';

import { useEffect, useRef } from 'react';
import { useAnalytics } from './use-analytics';

export function useCafeViewTracking(
  cafeId: string,
  slug: string,
  source: 'map' | 'list' | 'roulette' | 'similar' | 'direct' = 'direct'
) {
  const { track } = useAnalytics();
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();

    // Track cafe_view on mount
    track('cafe_view', { cafe_id: cafeId, slug, source });

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent > maxScrollRef.current) {
        maxScrollRef.current = scrollPercent;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      track('cafe_view_duration', {
        cafe_id: cafeId,
        duration_seconds: duration,
        scroll_depth_percent: maxScrollRef.current,
      });
    };
  }, [cafeId, slug, source, track]);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-cafe-view-tracking.ts
git commit -m "feat: add useCafeViewTracking hook (view + duration + scroll)"
```

---

### Task 12: Impression Tracking (IntersectionObserver)

**Files:**
- Create: `src/hooks/use-impression-tracking.ts`

- [ ] **Step 1: Create the hook**

Tracks cafe cards becoming visible using IntersectionObserver. Deduplicates per session (each cafe fires once). Batches impressions and sends them in groups.

```typescript
// src/hooks/use-impression-tracking.ts
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAnalytics } from './use-analytics';

const impressedCafeIds = new Set<string>();
const pendingImpressions: string[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

export function useImpressionTracking(
  context: 'list' | 'map' | 'roulette'
) {
  const { track } = useAnalytics();
  const observerRef = useRef<IntersectionObserver | null>(null);

  const flush = useCallback(() => {
    if (pendingImpressions.length === 0) return;
    const batch = [...pendingImpressions];
    pendingImpressions.length = 0;
    track('cafe_impression', { cafe_ids: batch, context });
  }, [track, context]);

  const observe = useCallback(
    (element: HTMLElement | null, cafeId: string) => {
      if (!element || !observerRef.current) return;
      element.dataset.cafeId = cafeId;
      observerRef.current.observe(element);
    },
    []
  );

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const cafeId = (entry.target as HTMLElement).dataset.cafeId;
          if (!cafeId || impressedCafeIds.has(cafeId)) continue;
          impressedCafeIds.add(cafeId);
          pendingImpressions.push(cafeId);

          // Debounce flush: send batch after 1s of no new impressions
          if (flushTimeout) clearTimeout(flushTimeout);
          flushTimeout = setTimeout(flush, 1000);
        }
      },
      { threshold: 0.5 }
    );

    return () => {
      observerRef.current?.disconnect();
      // Flush any remaining on unmount
      flush();
    };
  }, [flush]);

  return { observe };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-impression-tracking.ts
git commit -m "feat: add useImpressionTracking hook with batched IntersectionObserver"
```

---

### Task 13: Map Tracking (debounced)

**Files:**
- Create: `src/hooks/use-map-tracking.ts`

- [ ] **Step 1: Create the hook**

Debounced (500ms) map viewport tracking and marker click tracking.

```typescript
// src/hooks/use-map-tracking.ts
'use client';

import { useCallback, useRef } from 'react';
import { useAnalytics } from './use-analytics';

export function useMapTracking() {
  const { track } = useAnalytics();
  const viewportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackMarkerClick = useCallback(
    (cafeId: string, zoomLevel: number) => {
      track('marker_click', { cafe_id: cafeId, zoom_level: zoomLevel });
    },
    [track]
  );

  const trackViewport = useCallback(
    (centerLat: number, centerLng: number, zoom: number, visibleCafesCount: number) => {
      if (viewportTimeoutRef.current) clearTimeout(viewportTimeoutRef.current);
      viewportTimeoutRef.current = setTimeout(() => {
        track('map_viewport', {
          center_lat: centerLat,
          center_lng: centerLng,
          zoom,
          visible_cafes_count: visibleCafesCount,
        });
      }, 500);
    },
    [track]
  );

  return { trackMarkerClick, trackViewport };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-map-tracking.ts
git commit -m "feat: add useMapTracking hook with debounced viewport tracking"
```

---

### Task 14: Compare Session Tracking

**Files:**
- Create: `src/hooks/use-compare-session.ts`

- [ ] **Step 1: Create the hook**

Tracks which cafes a user views in a session and fires `cafe_compare_session` on page unload or after 30min inactivity.

```typescript
// src/hooks/use-compare-session.ts
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAnalytics } from './use-analytics';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function useCompareSession() {
  const { track } = useAnalytics();
  const cafesViewedRef = useRef<string[]>([]);
  const selectedCafeRef = useRef<string | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const fireSession = useCallback(() => {
    if (firedRef.current || cafesViewedRef.current.length === 0) return;
    firedRef.current = true;
    track('cafe_compare_session', {
      cafes_viewed: cafesViewedRef.current,
      selected: selectedCafeRef.current,
    });
  }, [track]);

  const addCafeViewed = useCallback((cafeId: string) => {
    if (!cafesViewedRef.current.includes(cafeId)) {
      cafesViewedRef.current.push(cafeId);
    }
    // Reset inactivity timer
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(fireSession, INACTIVITY_TIMEOUT);
  }, [fireSession]);

  const setSelectedCafe = useCallback((cafeId: string) => {
    selectedCafeRef.current = cafeId;
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => fireSession();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      fireSession();
    };
  }, [fireSession]);

  return { addCafeViewed, setSelectedCafe };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-compare-session.ts
git commit -m "feat: add useCompareSession hook (beforeunload + inactivity)"
```

---

## Chunk 4: Integration Into Existing Components

### Task 15: Integrate Tracking in Cafe Detail Page

**Files:**
- Modify: `src/components/cafe-detail/cafe-detail-content.tsx`

- [ ] **Step 1: Add cafe view tracking**

At the top of the `CafeDetailContent` component, add:

```typescript
import { useCafeViewTracking } from '@/hooks/use-cafe-view-tracking';
import { useAnalytics } from '@/hooks/use-analytics';
```

Inside the component body, early:
```typescript
useCafeViewTracking(cafe.id, cafe.slug, 'direct');
const { track } = useAnalytics();
```

- [ ] **Step 2: Track share events**

Find the existing share handler and add tracking after the share action:

```typescript
track('cafe_share', { cafe_id: cafe.id, method: shared ? 'native' : 'copy_link' });
```

- [ ] **Step 3: Track outbound clicks**

For Instagram, Naver, website links, add onClick handlers:

```typescript
onClick={() => track('outbound_click', { cafe_id: cafe.id, url: href, link_type: 'instagram' })}
```

- [ ] **Step 4: Track directions click**

On the directions CTA:
```typescript
onClick={() => track('directions_click', { cafe_id: cafe.id, source: 'detail' })}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/cafe-detail/cafe-detail-content.tsx
git commit -m "feat: integrate analytics tracking in cafe detail page"
```

---

### Task 16: Integrate Tracking in Favorites & Ratings

**Files:**
- Modify: `src/components/favorites/favorite-button.tsx`
- Modify: `src/components/ratings/rating-form.tsx`

- [ ] **Step 1: Track favorite toggle**

In `favorite-button.tsx`, import `useAnalytics` and after successful toggle:

```typescript
const { track } = useAnalytics();
// After toggleFavoriteAction succeeds:
track('favorite_toggle', { cafe_id: cafeId, action: newState ? 'add' : 'remove' });
```

- [ ] **Step 2: Track rating submit**

In `rating-form.tsx`, after successful rating submission:

```typescript
const { track } = useAnalytics();
// After submitRating succeeds:
track('rating_submit', {
  cafe_id: cafeId,
  overall: data.overall,
  dimensions_filled: Object.entries(data).filter(([k, v]) => k !== 'cafeId' && v != null).length,
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/favorites/favorite-button.tsx src/components/ratings/rating-form.tsx
git commit -m "feat: add analytics tracking to favorites toggle and rating submit"
```

---

### Task 17: Integrate Tracking in Map

**Files:**
- Modify: `src/components/map/cafe-map.tsx`

- [ ] **Step 1: Add map tracking**

Import and use `useMapTracking`:

```typescript
import { useMapTracking } from '@/hooks/use-map-tracking';

// In component:
const { trackMarkerClick, trackViewport } = useMapTracking();
```

Wire `trackMarkerClick` to marker click handler, passing cafe ID and current zoom level.

Wire `trackViewport` to the Kakao Maps `idle` event (fires after zoom/pan settles), passing center lat/lng, zoom, and visible cafes count.

- [ ] **Step 2: Commit**

```bash
git add src/components/map/cafe-map.tsx
git commit -m "feat: add analytics tracking to map markers and viewport"
```

---

### Task 18: Integrate Tracking in Roulette

**Files:**
- Modify: `src/components/roulette/roulette-client.tsx`

- [ ] **Step 1: Add roulette tracking**

Import `useAnalytics` and add tracking at key points:

```typescript
const { track } = useAnalytics();

// On spin:
track('roulette_spin', { filters_applied: filters, result_cafe_id: selectedCafe.id });

// On accept (user clicks "Go" or directions):
track('roulette_accept', { cafe_id: selectedCafe.id });

// On respin (user clicks "Try Again"):
track('roulette_respin', { rejected_cafe_id: currentCafe.id });
```

- [ ] **Step 2: Commit**

```bash
git add src/components/roulette/roulette-client.tsx
git commit -m "feat: add analytics tracking to roulette spin/accept/respin"
```

---

### Task 19: Integrate Search & Filter Tracking

**Files:**
- Modify: `src/hooks/use-map-filters.ts`

- [ ] **Step 1: Add filter_apply tracking**

In the `useMapFilters` hook, import `useAnalytics` and track when filters change:

```typescript
import { useAnalytics } from '@/hooks/use-analytics';

// Inside the hook:
const { track } = useAnalytics();

// When filters are applied (in the updateFilter or applyPreset function),
// debounce and track:
track('filter_apply', { filters: currentFilters, result_count: resultCount });
```

Note: `result_count` may need to be passed back from the component that knows the count. If not easily available, omit it initially and add in a follow-up.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-map-filters.ts
git commit -m "feat: add filter_apply analytics tracking to useMapFilters"
```

---

### Task 20: Integrate Photo Tracking

**Files:**
- Modify: `src/components/card-photo-slider.tsx`

- [ ] **Step 1: Track photo swipe depth**

Import `useAnalytics` and track max photos viewed when the slider unmounts or the user navigates away:

```typescript
const { track } = useAnalytics();

// On unmount or when user leaves:
track('photo_swipe_depth', {
  cafe_id: cafeId,
  total_photos: photos.length,
  max_viewed: maxViewedIndex + 1,
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/card-photo-slider.tsx
git commit -m "feat: add photo swipe depth analytics tracking"
```

---

## Chunk 5: Advanced Features

### Task 21: Geolocation Integration

**Files:**
- Modify: `src/hooks/use-analytics.ts` — already has `getLocation()`, just needs district reverse geocoding

- [ ] **Step 1: Add district reverse geocoding**

In `src/hooks/use-analytics.ts`, update the `getLocation` function to use Kakao Maps reverse geocoding API to derive the district name:

```typescript
// After getting coordinates, use Kakao geocoder to get district name
if (window.kakao?.maps?.services) {
  const geocoder = new window.kakao.maps.services.Geocoder();
  geocoder.coord2RegionCode(
    pos.coords.longitude,
    pos.coords.latitude,
    (result: Array<{ region_2depth_name: string }>, status: string) => {
      if (status === window.kakao.maps.services.Status.OK && result[0]) {
        cachedLocation!.district = result[0].region_2depth_name;
      }
      resolve(cachedLocation);
    }
  );
} else {
  resolve(cachedLocation);
}
```

Note: The Kakao Maps SDK is already loaded in the root layout. The `services` library is included.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-analytics.ts
git commit -m "feat: add Kakao reverse geocoding for district detection"
```

---

### Task 22: Share Button Enhancement

**Files:**
- Modify: `src/components/cafe-detail/cafe-detail-content.tsx`

- [ ] **Step 1: Enhance share with Kakao Share**

The existing share button uses Capacitor Share API on native and clipboard fallback on web. Enhance to add Kakao Share as a method:

```typescript
// Add Kakao Share option for web (non-native)
const shareViaKakao = () => {
  if (!window.Kakao?.Share) return false;
  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: cafeName,
      description: cafe.description?.en || '',
      imageUrl: cafe.photos?.[0]?.url || '',
      link: { webUrl: url, mobileWebUrl: url },
    },
  });
  track('cafe_share', { cafe_id: cafe.id, method: 'kakao' });
  return true;
};
```

Also add Web Share API (`navigator.share`) as a method, tracking with `method: 'native'`.

- [ ] **Step 2: Commit**

```bash
git add src/components/cafe-detail/cafe-detail-content.tsx
git commit -m "feat: enhance share button with Kakao Share and Web Share API"
```

---

### Task 23: Implicit Preferences RPC

**Files:**
- Create: `supabase/migrations/3106_user_preferences_rpc.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Calculate user taste profile from ratings, favorites, and views
create or replace function get_user_preferences(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  with
  -- Ratings given (weight: 3)
  rated_cafes as (
    select
      r.cafe_id,
      3 as weight,
      r.drinks, r.service, r.price_value, r.quietness,
      r.seating, r.comfort, r.food, r.lighting, r.aesthetic,
      r.pet_friendly, r.has_wifi, r.has_power_outlets, r.is_laptop_friendly, r.has_parking
    from ratings r
    where r.user_id = p_user_id and r.overall >= 4
  ),
  -- Favorited cafes (weight: 2)
  fav_cafes as (
    select
      c.id as cafe_id,
      2 as weight,
      (c.ratings->>'drinks')::numeric as drinks,
      (c.ratings->>'service')::numeric as service,
      (c.ratings->>'price_value')::numeric as price_value,
      (c.ratings->>'quietness')::numeric as quietness,
      (c.ratings->>'seating')::numeric as seating,
      (c.ratings->>'comfort')::numeric as comfort,
      (c.ratings->>'food')::numeric as food,
      (c.ratings->>'lighting')::numeric as lighting,
      (c.ratings->>'aesthetic')::numeric as aesthetic,
      c.is_pet_friendly as pet_friendly,
      c.has_wifi,
      c.has_power_outlets,
      c.is_laptop_friendly,
      c.has_parking
    from favorites f
    join cafes c on c.id = f.cafe_id
    where f.user_id = p_user_id
  ),
  -- Most viewed cafes (weight: 1) — from analytics
  viewed_cafes as (
    select
      (ae.event_data->>'cafe_id')::uuid as cafe_id,
      1 as weight,
      count(*) as view_count
    from analytics_events ae
    where ae.user_id = p_user_id
      and ae.event_type = 'cafe_view'
    group by ae.event_data->>'cafe_id'
    order by view_count desc
    limit 20
  ),
  viewed_with_data as (
    select
      vc.cafe_id,
      vc.weight,
      (c.ratings->>'drinks')::numeric as drinks,
      (c.ratings->>'service')::numeric as service,
      (c.ratings->>'price_value')::numeric as price_value,
      (c.ratings->>'quietness')::numeric as quietness,
      (c.ratings->>'seating')::numeric as seating,
      (c.ratings->>'comfort')::numeric as comfort,
      (c.ratings->>'food')::numeric as food,
      (c.ratings->>'lighting')::numeric as lighting,
      (c.ratings->>'aesthetic')::numeric as aesthetic,
      c.is_pet_friendly as pet_friendly,
      c.has_wifi,
      c.has_power_outlets,
      c.is_laptop_friendly,
      c.has_parking
    from viewed_cafes vc
    join cafes c on c.id = vc.cafe_id
  ),
  -- Combine all sources
  all_sources as (
    select * from rated_cafes
    union all
    select cafe_id, weight, drinks, service, price_value, quietness,
           seating, comfort, food, lighting, aesthetic,
           pet_friendly, has_wifi, has_power_outlets, is_laptop_friendly, has_parking
    from fav_cafes
    union all
    select cafe_id, weight, drinks, service, price_value, quietness,
           seating, comfort, food, lighting, aesthetic,
           pet_friendly, has_wifi, has_power_outlets, is_laptop_friendly, has_parking
    from viewed_with_data
  ),
  -- Weighted averages
  aggregated as (
    select
      round(sum(drinks * weight) / nullif(sum(case when drinks is not null then weight end), 0), 1) as drinks,
      round(sum(service * weight) / nullif(sum(case when service is not null then weight end), 0), 1) as service,
      round(sum(price_value * weight) / nullif(sum(case when price_value is not null then weight end), 0), 1) as price_value,
      round(sum(quietness * weight) / nullif(sum(case when quietness is not null then weight end), 0), 1) as quietness,
      round(sum(seating * weight) / nullif(sum(case when seating is not null then weight end), 0), 1) as seating,
      round(sum(comfort * weight) / nullif(sum(case when comfort is not null then weight end), 0), 1) as comfort,
      round(sum(food * weight) / nullif(sum(case when food is not null then weight end), 0), 1) as food,
      round(sum(lighting * weight) / nullif(sum(case when lighting is not null then weight end), 0), 1) as lighting,
      round(sum(aesthetic * weight) / nullif(sum(case when aesthetic is not null then weight end), 0), 1) as aesthetic,
      -- Boolean tendencies: weighted majority
      round(sum(case when pet_friendly then weight else 0 end)::numeric / nullif(sum(weight), 0), 2) > 0.5 as pet_friendly,
      round(sum(case when has_wifi then weight else 0 end)::numeric / nullif(sum(weight), 0), 2) > 0.5 as has_wifi,
      round(sum(case when has_power_outlets then weight else 0 end)::numeric / nullif(sum(weight), 0), 2) > 0.5 as has_power_outlets,
      round(sum(case when is_laptop_friendly then weight else 0 end)::numeric / nullif(sum(weight), 0), 2) > 0.5 as is_laptop_friendly,
      round(sum(case when has_parking then weight else 0 end)::numeric / nullif(sum(weight), 0), 2) > 0.5 as has_parking
    from all_sources
  )
  select jsonb_build_object(
    'dimensions', jsonb_build_object(
      'drinks', drinks, 'service', service, 'price_value', price_value,
      'quietness', quietness, 'seating', seating, 'comfort', comfort,
      'food', food, 'lighting', lighting, 'aesthetic', aesthetic
    ),
    'features', jsonb_build_object(
      'pet_friendly', pet_friendly, 'has_wifi', has_wifi,
      'has_power_outlets', has_power_outlets, 'is_laptop_friendly', is_laptop_friendly,
      'has_parking', has_parking
    )
  ) into result
  from aggregated;

  return coalesce(result, '{}'::jsonb);
end;
$$;
```

- [ ] **Step 2: Apply migration**

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/3106_user_preferences_rpc.sql
git commit -m "feat: add get_user_preferences RPC (weighted implicit preferences)"
```

---

### Task 24: Monthly Aggregation Edge Function

**Files:**
- Create: `supabase/functions/aggregate-monthly-stats/index.ts`

- [ ] **Step 1: Create the edge function**

```typescript
// supabase/functions/aggregate-monthly-stats/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Calculate for previous month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthDate = monthStart.toISOString().slice(0, 10);

  // Get all active cafes
  const { data: cafes } = await supabase
    .from('cafes')
    .select('id')
    .eq('status', 'active');

  if (!cafes?.length) {
    return new Response(JSON.stringify({ message: 'No cafes to aggregate' }), { status: 200 });
  }

  const stats = [];

  for (const cafe of cafes) {
    const cafeId = cafe.id;

    // Fetch all events for this cafe in the month
    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', monthEnd.toISOString())
      .or(`event_data->>cafe_id.eq.${cafeId},event_data->cafe_ids.cs.["${cafeId}"]`);

    if (!events?.length) continue;

    const impressionEvents = events.filter(e => e.event_type === 'cafe_impression');
    const clickEvents = events.filter(e => e.event_type === 'cafe_view');
    const durationEvents = events.filter(e => e.event_type === 'cafe_view_duration');
    const directionsEvents = events.filter(e => e.event_type === 'directions_click');
    const outboundEvents = events.filter(e => e.event_type === 'outbound_click');
    const shareEvents = events.filter(e => e.event_type === 'cafe_share');
    const rouletteSpins = events.filter(e => e.event_type === 'roulette_spin');
    const rouletteAccepts = events.filter(e => e.event_type === 'roulette_accept');

    const uniqueSessions = new Set(clickEvents.map(e => e.session_id));
    const durations = durationEvents.map(e => e.event_data?.duration_seconds || 0);
    const bounceCount = durationEvents.filter(e => (e.event_data?.duration_seconds || 0) < 10).length;

    // Visitor languages
    const langCounts: Record<string, number> = {};
    clickEvents.forEach(e => {
      const lang = e.browser_language?.slice(0, 2) || 'unknown';
      langCounts[lang] = (langCounts[lang] || 0) + 1;
    });

    // Visitor devices
    const deviceCounts: Record<string, number> = {};
    clickEvents.forEach(e => {
      const device = e.device_type || 'unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    stats.push({
      cafe_id: cafeId,
      month: monthDate,
      impressions: impressionEvents.length,
      clicks: clickEvents.length,
      directions_clicks: directionsEvents.length,
      outbound_clicks: outboundEvents.length,
      shares: shareEvents.length,
      avg_view_duration: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      bounce_rate: durationEvents.length > 0
        ? bounceCount / durationEvents.length
        : 0,
      unique_visitors: uniqueSessions.size,
      visitor_languages: langCounts,
      visitor_devices: deviceCounts,
      roulette_appearances: rouletteSpins.length,
      roulette_accepts: rouletteAccepts.length,
    });
  }

  // Upsert all stats
  if (stats.length > 0) {
    const { error } = await supabase
      .from('cafe_monthly_stats')
      .upsert(stats, { onConflict: 'cafe_id,month' });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  return new Response(
    JSON.stringify({ message: `Aggregated stats for ${stats.length} cafes`, month: monthDate }),
    { status: 200 }
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/aggregate-monthly-stats/index.ts
git commit -m "feat: add monthly stats aggregation edge function"
```

---

### Task 25: Cron Trigger for Monthly Aggregation

**Files:**
- Create: `supabase/migrations/3107_monthly_stats_cron.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Schedule monthly stats aggregation: 2 AM on 1st of each month
select cron.schedule(
  'aggregate-monthly-cafe-stats',
  '0 2 1 * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/aggregate-monthly-stats',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Note: If `pg_net` is not available, the cron can alternatively invoke the function via an external scheduler (Vercel Cron, etc.). Adjust based on Supabase project capabilities.

- [ ] **Step 2: Apply migration**

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/3107_monthly_stats_cron.sql
git commit -m "feat: schedule monthly stats aggregation cron (1st of month, 2 AM)"
```

---

### Task 26: Auth Event Tracking

**Files:**
- Modify: `src/app/(auth)/login/page-client.tsx` or equivalent login component
- Modify: `src/app/(auth)/verify-email/page-client.tsx` or signup success component

- [ ] **Step 1: Track login events**

After successful login, track:
```typescript
track('login', { method: 'email' }); // or 'google', 'kakao'
```

- [ ] **Step 2: Track signup events**

After successful signup/verification:
```typescript
track('signup', { method: 'email' }); // or 'google', 'kakao'
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/login/page-client.tsx src/app/(auth)/verify-email/page-client.tsx
git commit -m "feat: add analytics tracking for login and signup events"
```

---

### Task 27: Update Profile Type

**Files:**
- Modify: `src/types/profile.ts`

- [ ] **Step 1: Add is_pro to Profile type**

Add `is_pro: boolean` to the `Profile` interface:

```typescript
is_pro: boolean;
```

- [ ] **Step 2: Commit**

```bash
git add src/types/profile.ts
git commit -m "feat: add is_pro field to Profile type"
```

---

## Implementation Notes

**Order of execution:** Chunks 1-2-3-4-5 must be sequential. Within each chunk, tasks can be parallelized where there are no file conflicts.

**Testing approach:** Analytics tracking is inherently side-effect-heavy. Testing focuses on:
- Consent checking logic (unit testable)
- Event payload construction (unit testable)
- Integration verification via Supabase dashboard (manual check that events appear)

**Migration application:** Use Supabase MCP `apply_migration` tool or `npx supabase db push`. Migrations must be applied in order (3101-3107).

**i18n note:** Translation keys must be added before the closing `};` in each locale file. Use grep to find the exact insertion point: search for `'cookies.learnMore'` and add after that line.

**Kakao SDK types:** The `window.kakao` object may need a type declaration. Add to an existing `global.d.ts` or create one if needed.
