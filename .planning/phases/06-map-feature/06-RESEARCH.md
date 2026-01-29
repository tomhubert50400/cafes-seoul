# Phase 6: Map Feature - Research

**Researched:** 2026-01-29
**Domain:** Kakao Maps integration with Next.js 16 + React 19
**Confidence:** HIGH

## Summary

This research covers the implementation of a dual-map system for the Cafes Seoul application:
1. **Full Interactive Map** (`/map`) - A manipulable map showing all cafes with clustering, search, and navigation
2. **Static Map** (cafe profile pages) - A non-interactive map focused on a single cafe location

**Primary Recommendation:** Use **Kakao Maps** via `react-kakao-maps-sdk` for both map types. Kakao Maps is the standard for Korean location-based services and provides the most accurate map data for Seoul. The project already uses Kakao OAuth, so the developer account infrastructure exists.

**Key architectural decisions:**
- Use `react-kakao-maps-sdk` v1.2.0 for React component wrappers
- Load Kakao Maps script via `useKakaoLoader` hook with proper loading states
- Implement marker clustering for the full map (100+ cafes)
- Use `StaticMap` component for cafe profile pages
- Store Kakao API key in environment variables

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-kakao-maps-sdk | 1.2.0 | React components for Kakao Maps | Official community wrapper, 6.9k weekly downloads, actively maintained |
| kakao.maps.d.ts | latest | TypeScript definitions | Official type definitions for Kakao Maps API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog | existing | Map filter modal | Already in project, for mobile filter UI |
| lucide-react | existing | Map control icons | Already in project, for custom controls |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Kakao Maps | Google Maps | Less accurate for Korea, no local transit data |
| Kakao Maps | Naver Maps | Similar quality, but Kakao has better cafe POI data |
| Kakao Maps | Leaflet + OSM | Free but inaccurate/incomplete for Seoul cafes |
| react-kakao-maps-sdk | Raw Kakao JS API | More control but loses React integration benefits |

**Installation:**
```bash
npm install react-kakao-maps-sdk
npm install -D kakao.maps.d.ts
```

**tsconfig.json update:**
```json
{
  "compilerOptions": {
    "types": ["kakao.maps.d.ts"]
  }
}
```

**Environment Variables:**
```bash
# .env.local
NEXT_PUBLIC_KAKAO_MAPS_API_KEY=your_kakao_javascript_key
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── map/
│       ├── map-provider.tsx          # Script loader provider
│       ├── cafe-map.tsx              # Full interactive map
│       ├── cafe-static-map.tsx       # Static map for profiles
│       ├── cafe-marker.tsx           # Custom marker component
│       ├── cafe-info-window.tsx      # Popup content for markers
│       └── map-controls.tsx          # Zoom, locate, etc.
├── hooks/
│   └── use-cafe-map.ts               # Map state management
├── app/
│   ├── map/
│   │   └── page.tsx                  # /map route
│   └── cafes/
│       └── [slug]/
│           └── page.tsx              # Already exists, add static map
└── types/
    └── map.ts                        # Map-specific types
```

### Pattern 1: Script Loading with Provider
**What:** Load Kakao Maps script once at app level using `useKakaoLoader`
**When to use:** Required for all Kakao Maps usage
**Example:**
```typescript
// src/components/map/map-provider.tsx
'use client';

import { useKakaoLoader } from 'react-kakao-maps-sdk';

interface MapProviderProps {
  children: React.ReactNode;
}

export function MapProvider({ children }: MapProviderProps) {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAPS_API_KEY!,
    libraries: ['clusterer', 'services'], // Required for clustering and search
  });

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center text-destructive">
        Failed to load map
      </div>
    );
  }

  return <>{children}</>;
}
```

### Pattern 2: Full Interactive Map
**What:** Complete map with all cafes, clustering, and interactions
**When to use:** `/map` page
**Example:**
```typescript
// src/components/map/cafe-map.tsx
'use client';

import { Map, MapMarker, MarkerClusterer } from 'react-kakao-maps-sdk';
import type { CafeSummary } from '@/types/cafe';

interface CafeMapProps {
  cafes: CafeSummary[];
  onCafeSelect?: (cafe: CafeSummary) => void;
}

export function CafeMap({ cafes, onCafeSelect }: CafeMapProps) {
  return (
    <Map
      center={{ lat: 37.5665, lng: 126.9780 }} // Seoul City Hall
      style={{ width: '100%', height: '100vh' }}
      level={7}
    >
      <MarkerClusterer
        averageCenter={true}
        minLevel={4}
        styles={[{
          width: '50px',
          height: '50px',
          background: 'rgba(0, 0, 255, 0.8)',
          borderRadius: '50%',
          color: '#fff',
          textAlign: 'center',
          lineHeight: '50px',
        }]}
      >
        {cafes.map((cafe) => (
          <MapMarker
            key={cafe.id}
            position={{ lat: cafe.latitude, lng: cafe.longitude }}
            onClick={() => onCafeSelect?.(cafe)}
          />
        ))}
      </MarkerClusterer>
    </Map>
  );
}
```

### Pattern 3: Static Map for Cafe Profiles
**What:** Non-interactive map centered on a single cafe
**When to use:** Cafe detail page sidebar
**Example:**
```typescript
// src/components/map/cafe-static-map.tsx
'use client';

import { StaticMap } from 'react-kakao-maps-sdk';
import type { Cafe } from '@/types/cafe';

interface CafeStaticMapProps {
  cafe: Cafe;
  width?: string;
  height?: string;
}

export function CafeStaticMap({ 
  cafe, 
  width = '100%', 
  height = '200px' 
}: CafeStaticMapProps) {
  return (
    <StaticMap
      center={{ lat: cafe.latitude, lng: cafe.longitude }}
      style={{ width, height }}
      level={3}
      marker={{
        position: { lat: cafe.latitude, lng: cafe.longitude },
        text: cafe.name.ko,
      }}
      draggable={false}
      zoomable={false}
    />
  );
}
```

### Pattern 4: Custom Overlay with Cafe Info
**What:** Custom styled popup showing cafe details on marker click
**When to use:** When user clicks a marker on the full map
**Example:**
```typescript
// src/components/map/cafe-info-window.tsx
'use client';

import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import Link from 'next/link';
import type { CafeSummary } from '@/types/cafe';

interface CafeInfoWindowProps {
  cafe: CafeSummary;
  onClose: () => void;
}

export function CafeInfoWindow({ cafe, onClose }: CafeInfoWindowProps) {
  return (
    <CustomOverlayMap
      position={{ lat: cafe.latitude, lng: cafe.longitude }}
      yAnchor={1.2}
    >
      <div className="relative min-w-[200px] rounded-lg border bg-white p-3 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
        <h3 className="font-semibold">{cafe.name.ko}</h3>
        <p className="text-sm text-gray-600">{cafe.address.ko}</p>
        <Link
          href={`/cafes/${cafe.slug}`}
          className="mt-2 inline-block text-sm text-blue-600 hover:underline"
        >
          View Details →
        </Link>
      </div>
    </CustomOverlayMap>
  );
}
```

### Anti-Patterns to Avoid

- **Loading script in every component:** Use MapProvider at layout level instead
- **Client-side cafe fetching without bounds:** Always fetch cafes within visible map bounds
- **Synchronous map operations:** Map operations may fail if map isn't fully loaded
- **Hard-coded coordinates:** Use cafe data from database, never hard-code positions

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Marker clustering | Custom clustering algorithm | MarkerClusterer from react-kakao-maps-sdk | Optimized, handles 1000+ markers, smooth animations |
| Map script loading | Manual script injection | useKakaoLoader hook | Handles loading states, errors, and cleanup |
| Geocoding (address → coords) | Custom geocoding | Kakao services library | Accurate Korean address data |
| Static map image | Screenshot/canvas | StaticMap component | Official API, always up-to-date |
| Map controls (zoom/pan) | Custom buttons | Built-in controls or official API | Consistent UX, touch-friendly |

**Key insight:** Kakao Maps has spent years optimizing marker clustering for Korean density patterns. Custom solutions will struggle with Seoul's cafe density (often 50+ cafes in a small area).

## Common Pitfalls

### Pitfall 1: Map Not Displaying
**What goes wrong:** Map shows blank/gray area
**Why it happens:** 
- API key not configured or domain not whitelisted
- Container has no explicit height
- Script not loaded before map component renders
**How to avoid:**
- Whitelist `localhost:3000` and production domain in Kakao Developers Console
- Always set explicit height on map container (e.g., `style={{ height: '400px' }}`)
- Use MapProvider to ensure script is loaded
**Warning signs:** Console errors about `kakao` not defined

### Pitfall 2: Markers Not Clustering
**What goes wrong:** Individual markers shown instead of clusters
**Why it happens:** `clusterer` library not loaded in script
**How to avoid:**
```typescript
useKakaoLoader({
  appkey: process.env.NEXT_PUBLIC_KAKAO_MAPS_API_KEY!,
  libraries: ['clusterer'], // REQUIRED for clustering
});
```

### Pitfall 3: Map Freezes/Performs Poorly
**What goes wrong:** Lag when panning/zooming with many markers
**Why it happens:** Rendering all markers at once without clustering
**How to avoid:** 
- Always use MarkerClusterer for 20+ markers
- Implement bounds-based fetching (only load visible cafes)
- Use `level` prop to control initial zoom

### Pitfall 4: Static Map Shows Nothing
**What goes wrong:** StaticMap component renders empty
**Why it happens:** Trying to render server-side or before script loads
**How to avoid:** 
- Wrap in 'use client' directive
- Use MapProvider to ensure script is loaded first
- Check that coordinates are valid numbers

### Pitfall 5: "window is not defined" Error
**What goes wrong:** Next.js build fails with window reference error
**Why it happens:** Map components rendered during SSR
**How to avoid:**
```typescript
// Always use dynamic import for map components in pages
import dynamic from 'next/dynamic';

const CafeMap = dynamic(
  () => import('@/components/map/cafe-map').then((mod) => mod.CafeMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);
```

## Code Examples

### Full Map Page
```typescript
// src/app/map/page.tsx
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { transformCafe } from '@/lib/supabase/transforms';
import type { CafeSummary } from '@/types/cafe';

const CafeMapWrapper = dynamic(
  () => import('@/components/map/cafe-map-wrapper').then((mod) => mod.CafeMapWrapper),
  { ssr: false }
);

async function getCafes(): Promise<CafeSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('cafes')
    .select('id, name, slug, address, district_id, latitude, longitude, overall_rating, total_ratings, price_range, cafe_type, has_wifi, has_power_outlets, is_pet_friendly, is_laptop_friendly, primary_image_url')
    .eq('status', 'active');
  
  return (data || []).map(transformCafe);
}

export default async function MapPage() {
  const cafes = await getCafes();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} />
      <main className="h-[calc(100vh-3.5rem)]">
        <CafeMapWrapper cafes={cafes} />
      </main>
    </>
  );
}
```

### Map Wrapper (Client Component)
```typescript
// src/components/map/cafe-map-wrapper.tsx
'use client';

import { MapProvider } from './map-provider';
import { CafeMap } from './cafe-map';
import type { CafeSummary } from '@/types/cafe';

interface CafeMapWrapperProps {
  cafes: CafeSummary[];
}

export function CafeMapWrapper({ cafes }: CafeMapWrapperProps) {
  return (
    <MapProvider>
      <CafeMap cafes={cafes} />
    </MapProvider>
  );
}
```

### Integration with Existing Cafe Detail Page
```typescript
// Update: src/components/cafe-detail/cafe-detail-content.tsx

// Replace the static map placeholder (lines 271-275) with:
import { CafeStaticMap } from '@/components/map/cafe-static-map';
import { MapProvider } from '@/components/map/map-provider';

// In the sidebar section:
<MapProvider>
  <CafeStaticMap cafe={cafe} height="200px" />
</MapProvider>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Google Maps for Korea | Kakao/Naver Maps | 2018+ | Better local data, Korean UI |
| Manual script tag | useKakaoLoader hook | 2022 | Better React integration |
| Class components | Function components + hooks | 2023 | Consistent with modern React |
| Server-side maps | Client-only with dynamic import | 2024 | SSR-safe, better hydration |

**Deprecated/outdated:**
- **Direct kakao.maps API manipulation:** Use react-kakao-maps-sdk components instead
- **Custom clustering:** Use built-in MarkerClusterer
- **Storing map instances in refs:** Use component state and props

## Open Questions

1. **Cafe Data Volume**
   - What we know: Current schema has ~25 districts, unknown cafe count
   - What's unclear: How many active cafes? (affects clustering strategy)
   - Recommendation: Implement bounds-based fetching if >200 cafes

2. **Map Filter Requirements**
   - What we know: Existing filter component has district, type, features filters
   - What's unclear: Should filters apply to map view?
   - Recommendation: Yes, sync filters between /cafes and /map

3. **Mobile Map UX**
   - What we know: Site is responsive, uses mobile-first approach
   - What's unclear: Should map be full-screen on mobile?
   - Recommendation: Full-screen map on mobile with floating filter button

4. **Kakao API Key Management**
   - What we know: Already have Kakao OAuth app
   - What's unclear: Same app for Maps API or separate?
   - Recommendation: Use same app, enable Maps API in console

## Sources

### Primary (HIGH confidence)
- [Kakao Maps JavaScript API Guide](https://apis.map.kakao.com/web/guide/) - Official documentation
- [react-kakao-maps-sdk GitHub](https://github.com/JaeSeoKim/react-kakao-maps-sdk) - Source code and examples
- [react-kakao-maps-sdk npm](https://www.npmjs.com/package/react-kakao-maps-sdk) - Package info
- [Kakao Maps API Documentation](https://apis.map.kakao.com/web/documentation/) - Complete API reference

### Secondary (MEDIUM confidence)
- Kakao Developers Console - API key management (requires login)
- Next.js 16 App Router documentation - Dynamic imports pattern

### Tertiary (LOW confidence)
- Community examples and blog posts (various dates)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official library, widely used (6k+ projects)
- Architecture: HIGH - Patterns from official examples and Next.js docs
- Pitfalls: HIGH - Common issues documented in GitHub issues and forums

**Research date:** 2026-01-29
**Valid until:** 2026-04-29 (Kakao Maps API is stable, expect 90-day validity)

**Prerequisites verified:**
- ✅ Project uses Next.js 16 with App Router
- ✅ React 19 with TypeScript
- ✅ Cafe data includes latitude/longitude
- ✅ Header already has link to `/map` route
- ✅ Kakao OAuth already integrated (developer account exists)
- ✅ Cafe detail page has placeholder for static map

**Estimated implementation time:** 
- Full interactive map: 2-3 hours
- Static map integration: 30 minutes
- Testing and polish: 1 hour
- Total: ~4-5 hours
