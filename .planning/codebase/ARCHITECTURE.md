# Architecture

**Analysis Date:** 2026-01-27

## Pattern Overview

**Overall:** Next.js 16 Server Components + API Routes (Fullstack Monolith)

**Key Characteristics:**
- React 19 with Server Components as default (App Router)
- REST API routes colocated with page routes in `src/app/api/`
- Supabase for data persistence and storage
- Multilingual support via client-side context (i18n)
- Type-safe data transformations from database to UI
- Utility/helper organization by domain (lib/api, lib/supabase, lib/i18n)

## Layers

**Presentation Layer:**
- Purpose: Render UI components to users
- Location: `src/components/`
- Contains: React components (functional, mostly client/hybrid)
- Depends on: i18n context, UI primitives, domain types
- Used by: Page routes, layouts

**Page Layer:**
- Purpose: Route handlers and page rendering
- Location: `src/app/` and `src/app/(main)/`, `src/app/(auth)/`
- Contains: Page components (default async Server Components), API route handlers
- Depends on: API client (`lib/api/cafes`), data fetching, types
- Used by: Next.js router; accessed by users via URLs

**API Layer:**
- Purpose: Provide REST endpoints for data fetching and mutations
- Location: `src/app/api/cafes/`, `src/app/api/reviews/`, `src/app/api/users/`, `src/app/api/districts/`
- Contains: Route handlers (GET, POST, PATCH, DELETE)
- Depends on: Supabase client, query builders, transformers
- Used by: Page components, client-side components, external clients

**Data Access Layer:**
- Purpose: Database queries and transformations
- Location: `src/lib/supabase/` (server.ts, transforms.ts)
- Contains: Supabase client factory, row-to-type transformers
- Depends on: Supabase SDK, type definitions
- Used by: API routes, server-side page components

**Business Logic / Utilities:**
- Purpose: Shared helpers, domain logic, constants
- Location: `src/lib/api/`, `src/lib/constants/`, `src/lib/utils/`
- Contains: Fetch wrappers (fetchCafes), district/neighborhood constants, general utilities
- Depends on: Types, API definitions
- Used by: Server components, API routes

**Type System:**
- Purpose: Enforce type safety across data boundaries
- Location: `src/types/`
- Contains: Interfaces and types (Cafe, Review, User, API params, responses)
- Depends on: None (zero dependencies)
- Used by: All layers

**Globalization Layer:**
- Purpose: Multilingual support (Korean, English)
- Location: `src/lib/i18n/`
- Contains: Context provider, language state, translation strings
- Depends on: React context, translations.ts data
- Used by: Root layout (server), UI components (client)

## Data Flow

**Cafe Listing (Browse):**

1. User navigates to `/cafes` page
2. Page component (`src/app/(main)/cafes/page.tsx`) renders on server
3. Server fetches featured cafes via `fetchCafes()` from `src/lib/api/cafes.ts`
4. Client-side fetch hits `GET /api/cafes` endpoint
5. API route (`src/app/api/cafes/route.ts`) creates Supabase client
6. Query builder filters/sorts cafes, applies pagination
7. Results transformed via `transformCafeSummary()` to CafeSummary type
8. API returns paginated response with meta
9. Page renders list of cafe cards with data

**Cafe Detail View:**

1. User clicks cafe or navigates to `/cafes/[slug]`
2. Dynamic page component (`src/app/(main)/cafes/[slug]/page.tsx`) loads
3. Fetches single cafe via `GET /api/cafes/[id]` API route
4. Full Cafe object transformed and rendered
5. Client-side components fetch reviews via `GET /api/cafes/[id]/reviews`
6. Reviews loaded and displayed with user info

**Search/Filter:**

1. User enters search query or selects filters
2. Search filters component builds query string with CafeListParams
3. Client fetches `GET /api/cafes/search` (for name/address search) or `GET /api/cafes?q=X&hasWifi=true`
4. API route applies conditional filters to Supabase query
5. Results returned and rendered immediately

**State Management:**

- Global UI state: i18n language (context in `src/lib/i18n/context.tsx`)
- Page state: Next.js URL searchParams for filters/pagination
- Component state: React useState for UI interactions
- Server state: Supabase (source of truth for data)
- No client-side state library (Zustand installed but appears unused)

## Key Abstractions

**CafeSummary vs Cafe:**
- Purpose: Separate lightweight list view data from detailed view data
- Examples: `src/types/cafe.ts` (interfaces), `src/lib/supabase/transforms.ts` (transformCafe, transformCafeSummary)
- Pattern: Database rows cast to loose type, then explicitly transformed to strict TypeScript interfaces

**Supabase Transform Functions:**
- Purpose: Convert snake_case database columns to camelCase domain objects
- Examples: `transformCafe()`, `transformReview()`, `transformUser()`, `getStorageUrl()`
- Pattern: Accept loose Record type, return strictly typed domain object; handle null/undefined gracefully

**API Parameter Objects:**
- Purpose: Type-safe query parameter passing
- Examples: `CafeListParams`, `ReviewListParams` (in `src/types/api.ts`)
- Pattern: Optional fields for optional query parameters; enums for constrained values (sortBy, sortOrder, cafeType)

**Translated Text Storage:**
- Purpose: Multi-language strings stored in JSONB database columns
- Examples: Name, address, description as `TranslatedText` (Record<string, string>)
- Pattern: Store `{ "en": "...", "ko": "..." }` in one column; helper function `getLocalizedText()` for retrieval

## Entry Points

**Web Root:**
- Location: `src/app/layout.tsx`
- Triggers: Application startup; wraps all routes
- Responsibilities: Root HTML setup, font loading (Geist, Noto Sans KR), I18nProvider injection, Toaster (notifications)

**Home Page:**
- Location: `src/app/page.tsx`
- Triggers: User visits `/`
- Responsibilities: Fetch featured cafes (top 6 by rating), render hero, districts, features sections

**Main Routes:**
- Location: `src/app/(main)/` (layout group)
- Triggers: User navigates to `/cafes`, `/districts`, `/map`, `/profile/`
- Responsibilities: Shared layout for authenticated/main app routes

**API Gateway - Cafes:**
- Location: `src/app/api/cafes/route.ts`
- Triggers: GET requests to `/api/cafes?page=X&limit=20&...`
- Responsibilities: Parse CafeListParams, build dynamic Supabase query, apply 12 filter types, paginate, transform results

**API Gateway - Search:**
- Location: `src/app/api/cafes/search/route.ts`
- Triggers: GET requests to `/api/cafes/search?q=X`
- Responsibilities: Validate search string (2+ chars), full-text search in name/address, return top 10 results

## Error Handling

**Strategy:** Log errors server-side, return NextResponse with HTTP status codes

**Patterns:**
- API errors: `return NextResponse.json({ error: message }, { status: 500 | 400 })`
- Validation errors: Check parameters before query (e.g., search query min length)
- Async errors: Try-catch in server components, log to console.error
- No custom error classes; plain Error objects with descriptive messages
- Client-side: Sonner toast notifications for user-facing errors

## Cross-Cutting Concerns

**Logging:** `console.error()` for exceptions; no structured logging or log levels

**Validation:**
- Type system enforces at compile time
- Query parameter validation in route handlers (parseInt with defaults, bounds checks)
- Search query length validation (min 2 chars)

**Authentication:**
- Supabase Auth (SSR integration via `@supabase/ssr`)
- Middleware in `src/lib/supabase/middleware.ts` (not fully explored but exists)
- Protected routes not yet fully implemented (auth layout exists but minimal content)

**I18n:**
- React context with client-side initialization
- Cookie-based language persistence (LANGUAGE_COOKIE_NAME)
- Browser language detection fallback
- Translations object in `src/lib/i18n/translations.ts`

**CORS/Requests:**
- Next.js handles CORS automatically for API routes
- Fetch revalidation: 60 seconds (ISR for featured cafes)

---

*Architecture analysis: 2026-01-27*
