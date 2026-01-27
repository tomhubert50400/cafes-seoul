# External Integrations

**Analysis Date:** 2026-01-27

## APIs & External Services

**Supabase (Primary Database & Auth):**
- Service: Supabase PostgreSQL database with authentication and file storage
- What it's used for: Core application data (cafes, reviews, users, profiles), real-time auth, image/file storage
- SDK/Client: `@supabase/supabase-js` 2.91.1, `@supabase/ssr` 0.8.0
- Auth:
  - Public key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client requests, RLS enforced)
  - Service role: `SUPABASE_SERVICE_ROLE_KEY` (server requests, bypass RLS when needed)
- URL: `NEXT_PUBLIC_SUPABASE_URL` (https://vanplvqjmmwgawuibhdg.supabase.co)
- Usage patterns:
  - Server client: `src/lib/supabase/server.ts` - uses SSR helper with cookie-based session management
  - Browser client: `src/lib/supabase/client.ts` - uses browser-safe client
  - Middleware: `src/lib/supabase/middleware.ts` - auth state refresh via Next.js middleware
  - RPC functions: `find_cafes_nearby` - PostGIS-based location queries in `src/app/api/cafes/nearby/route.ts`
  - Row-level security: Enforced on all queries based on user authentication

**Kakao Maps API:**
- Service: Korean mapping and place data
- What it's used for: Map visualization, place linking, location-based search context
- REST API: Server-side requests
  - Key: `KAKAO_REST_API_KEY` (secret)
  - Used for: Potential backend integration for place data enrichment
- Web API: Client-side map embedding
  - Key: `NEXT_PUBLIC_KAKAO_MAP_API_KEY` (public)
  - Used in: `src/components/cafe-detail/cafe-detail-content.tsx` - Deep links to Kakao Map for specific places
  - Place ID field stored: `kakaoPlaceId` in cafe records (see `src/types/cafe.ts`)
- Also supports Naver Map place IDs: `naverPlaceId` for alternative Korean mapping service

**Google Cloud Translation API:**
- Service: Machine translation service
- What it's used for: Translating cafe descriptions and content during import/seeding
- Key: `GOOGLE_TRANSLATE_API_KEY` (secret)
- Usage: Likely in seed scripts at `supabase/seed/` directory
- Implementation: Optional feature for data enrichment, not core application

**Google Fonts:**
- Service: Font hosting and delivery
- What it's used for: Typography loading in Next.js app
- Fonts used: Geist, Geist Mono, Noto Sans KR (see `src/app/layout.tsx`)
- Integration: Via Next.js `next/font/google` module (zero-layout-shift)

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
  - Client: Supabase JavaScript client (`@supabase/supabase-js`)
  - Tables: cafes, reviews, profiles, cafe_images, districts, neighborhoods
  - Features: PostGIS for geospatial queries, RLS policies
  - Migrations: `supabase/migrations/` directory

**File Storage:**
- Supabase Storage (S3-compatible object storage)
  - Bucket: `cafe-images` (public read access configured)
  - Usage: Cafe photos stored via Supabase client `storage` API
  - URL format: `https://vanplvqjmmwgawuibhdg.supabase.co/storage/v1/object/public/cafe-images/{path}`
  - Image serving: Configured in `next.config.ts` as remote pattern for Next.js Image optimization
  - Transform utility: `src/lib/supabase/transforms.ts` has `getStorageUrl()` function

**Caching:**
- HTTP caching via Next.js `revalidate` config
  - API routes use `next: { revalidate: 60 }` for 60-second ISR
  - Example: `src/lib/api/cafes.ts` fetch implementation
- No external caching service (Redis, etc.) configured

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in authentication)
  - Implementation: Session-based via cookies, managed through `@supabase/ssr`
  - Middleware: `src/middleware.ts` → `src/lib/supabase/middleware.ts` handles session refresh
  - Protected routes: `/profile`, `/favorites` (redirects to login if not authenticated)
  - Auth routes: `/login`, `/signup` (redirects to home if already authenticated)

**User Profiles:**
- Stored in Supabase `profiles` table
- Profile data: `src/types/user.ts` defines User and UserProfile types
- Transform: `src/lib/supabase/transforms.ts` provides `transformUser()` and `transformUserProfile()`

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, Rollbar, or equivalent integration found

**Logs:**
- Console-based logging only (see sonner for UI notifications)
- No centralized logging service configured

**Analytics:**
- Optional: `NEXT_PUBLIC_GA_ID` environment variable commented out in `.env.example` for Google Analytics
- Not currently active in codebase

## CI/CD & Deployment

**Hosting:**
- Vercel (primary deployment target for Next.js)
- Configuration: `.vercel` directory not present (uses defaults via next.config.ts)

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or other CI config files found

## Webhooks & Callbacks

**Incoming:**
- None detected - API routes are traditional HTTP endpoints

**Outgoing:**
- None detected - No webhook registrations or external POST callbacks found

## Environment Configuration

**Required env vars (critical):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project endpoint
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public auth key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key (server-side only)
- `NEXT_PUBLIC_KAKAO_MAP_API_KEY` - Kakao Maps client API key
- `KAKAO_REST_API_KEY` - Kakao REST API key (server-side)
- `NEXT_PUBLIC_APP_URL` - Application URL for redirects

**Optional env vars:**
- `GOOGLE_TRANSLATE_API_KEY` - For data import scripts
- `NEXT_PUBLIC_GA_ID` - Google Analytics tracking ID

**Secrets location:**
- `.env.local` - Local development secrets (Git-ignored)
- Environment variables in deployment platform (Vercel, etc.)
- Service keys should never be committed; `.env.example` provides template

## API Response Patterns

All API routes follow consistent patterns:

**Response wrapper:** `src/types/api.ts` defines:
- `ApiResponse<T>` - Basic response with data and optional error
- `PaginatedResponse<T>` - Responses with pagination metadata (total, page, limit, totalPages)
- `ApiError` - Error response format with optional code and details

**Main API Routes:**
- `GET /api/cafes` - List cafes with pagination
- `GET /api/cafes/[id]` - Get cafe detail
- `GET /api/cafes/[id]/reviews` - Get reviews for a cafe
- `GET /api/cafes/nearby` - Find nearby cafes using PostGIS
- `GET /api/cafes/search` - Full-text search across cafes
- `GET /api/districts` - List districts

---

*Integration audit: 2026-01-27*
