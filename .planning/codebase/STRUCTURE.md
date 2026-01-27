# Codebase Structure

**Analysis Date:** 2026-01-27

## Directory Layout

```
cafes-seoul/
├── src/
│   ├── app/                    # Next.js App Router (pages + API)
│   │   ├── (auth)/             # Auth route group (login, signup)
│   │   ├── (main)/             # Main app route group (protected routes)
│   │   │   ├── cafes/          # Cafe browsing pages
│   │   │   ├── districts/      # District pages
│   │   │   ├── map/            # Map view
│   │   │   └── profile/        # User profile sections
│   │   ├── api/                # REST API endpoints
│   │   │   ├── cafes/          # Cafe endpoints
│   │   │   ├── reviews/        # Review endpoints
│   │   │   ├── users/          # User endpoints
│   │   │   └── districts/      # District endpoints
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Tailwind base styles
│   │
│   ├── components/             # Reusable React components
│   │   ├── ui/                 # Radix UI primitives (shadcn/ui pattern)
│   │   ├── auth/               # Login/signup components
│   │   ├── cafe/               # Cafe-related components
│   │   ├── cafe-detail/        # Cafe detail page sections
│   │   ├── cafes/              # Cafe list page sections
│   │   ├── common/             # Shared components
│   │   ├── filter/             # Filter components
│   │   ├── home/               # Home page sections
│   │   ├── layout/             # Layout components (Header, Footer)
│   │   ├── map/                # Map components
│   │   ├── rating/             # Rating display components
│   │   ├── review/             # Review components
│   │   └── user/               # User profile components
│   │
│   ├── lib/                    # Utilities and shared functions
│   │   ├── api/                # API client functions
│   │   │   └── cafes.ts        # fetchCafes() wrapper
│   │   ├── constants/          # Constants and lookup data
│   │   │   ├── districts.ts    # District/neighborhood data
│   │   │   └── routes.ts       # URL constants
│   │   ├── i18n/               # Internationalization
│   │   │   ├── context.tsx     # I18nProvider and useI18n hook
│   │   │   ├── languages.ts    # Language definitions
│   │   │   └── translations.ts # Translation strings
│   │   ├── supabase/           # Database client and transformers
│   │   │   ├── server.ts       # createClient() factory
│   │   │   ├── client.ts       # Client-side Supabase
│   │   │   ├── middleware.ts   # Auth middleware
│   │   │   └── transforms.ts   # Row → Type transformers
│   │   └── utils.ts            # General utilities
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── index.ts            # Type exports
│   │   ├── api.ts              # API request/response types
│   │   ├── cafe.ts             # Cafe domain types
│   │   ├── review.ts           # Review domain types
│   │   └── user.ts             # User domain types
│   │
│   ├── hooks/                  # React hooks (currently empty)
│   └── stores/                 # Zustand stores (currently empty)
│
├── public/                     # Static assets
├── supabase/                   # Supabase config/migrations
├── scripts/                    # Utility scripts
├── .next/                      # Next.js build output
├── node_modules/               # Dependencies
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind CSS config
├── next.config.ts              # Next.js config
├── eslint.config.mjs           # ESLint config
├── .env.local                  # Local environment variables
└── .env.example                # Environment variable template
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router directory; contains pages and API routes
- Contains: Page components (.tsx), API route handlers (route.ts), layouts
- Key files: `layout.tsx` (root), `page.tsx` (home), `api/cafes/route.ts` (main API)

**`src/app/(auth)/`:**
- Purpose: Authentication-related pages
- Contains: Login and signup page components
- Key files: `login/page.tsx`, `signup/page.tsx`

**`src/app/(main)/`:**
- Purpose: Main app routes accessed after auth
- Contains: Cafe browsing, districts, map, user profile
- Key files: `cafes/page.tsx`, `cafes/[slug]/page.tsx`, `profile/page.tsx`

**`src/app/api/`:**
- Purpose: REST API endpoints
- Contains: GET/POST/PATCH/DELETE route handlers
- Key files: `cafes/route.ts`, `cafes/search/route.ts`, `reviews/route.ts`

**`src/components/ui/`:**
- Purpose: Radix UI + Tailwind primitive components (shadcn/ui pattern)
- Contains: Button, Card, Dialog, Input, Select, etc.
- Key files: `button.tsx`, `card.tsx`, `dialog.tsx`, `select.tsx`

**`src/components/cafe/`:**
- Purpose: Cafe-specific UI components
- Contains: Cafe card, cafe list, cafe detail sections
- Key files: Not fully explored; see naming convention

**`src/components/home/`:**
- Purpose: Home page section components
- Contains: Hero, featured cafes, districts, features, CTA
- Key files: `hero-section.tsx`, `featured-section.tsx`, `districts-section.tsx`

**`src/lib/api/`:**
- Purpose: Client-side API wrappers (fetch functions)
- Contains: fetchCafes() and other data-fetching functions
- Key files: `cafes.ts` (wraps GET /api/cafes)

**`src/lib/constants/`:**
- Purpose: Static data and enums
- Contains: Districts/neighborhoods, route strings, label mappings
- Key files: `districts.ts`, `routes.ts`

**`src/lib/i18n/`:**
- Purpose: Internationalization setup and context
- Contains: React context, language state, translations
- Key files: `context.tsx` (I18nProvider), `translations.ts` (all strings)

**`src/lib/supabase/`:**
- Purpose: Database integration
- Contains: Client initialization, data transformers, auth middleware
- Key files: `server.ts` (createClient), `transforms.ts` (row → type), `middleware.ts` (auth)

**`src/types/`:**
- Purpose: Centralized type definitions
- Contains: TypeScript interfaces for all domain objects
- Key files: `cafe.ts`, `review.ts`, `user.ts`, `api.ts`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root React component wrapping all routes
- `src/app/page.tsx`: Home page; fetches featured cafes on server
- `src/app/(main)/cafes/page.tsx`: Cafe list page with pagination/filters

**Configuration:**
- `tsconfig.json`: TypeScript compiler; path alias `@/*` → `./src/*`
- `tailwind.config.ts`: Tailwind CSS dark mode, color theme
- `next.config.ts`: Next.js runtime config
- `package.json`: Dependencies (React 19, Next.js 16, Supabase, Radix UI, TailwindCSS)

**Core Logic:**
- `src/app/api/cafes/route.ts`: Main data API; 150+ lines of filtering/sorting
- `src/lib/supabase/transforms.ts`: Type conversion functions; 170+ lines
- `src/types/cafe.ts`: Cafe domain types; defines CafeSummary, Cafe, RatingBreakdown
- `src/lib/i18n/context.tsx`: Multilingual support; useI18n hook

**API Routes (REST endpoints):**
- `src/app/api/cafes/route.ts`: GET paginated cafe list with filters
- `src/app/api/cafes/search/route.ts`: GET search results (2+ char min)
- `src/app/api/cafes/[id]/route.ts`: GET single cafe detail
- `src/app/api/reviews/route.ts`: GET/POST reviews
- `src/app/api/users/me/route.ts`: GET current user profile

**Data Fetching:**
- `src/lib/api/cafes.ts`: fetchCafes() wrapper; called by pages and components

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Components: `kebab-case.tsx` (e.g., `cafe-card.tsx`, `hero-section.tsx`)
- Types: `kebab-case.ts` (e.g., `api.ts`, `cafe.ts`)
- Utils/helpers: `camelCase.ts` (e.g., `transforms.ts`, `utils.ts`)

**Directories:**
- Feature directories: `kebab-case/` (e.g., `cafe-detail/`, `home/`)
- Type groupings: `snake_case/` or `kebab-case/` (e.g., `ui/`, `api/`)
- Grouping: Parentheses for layout groups (e.g., `(main)`, `(auth)`)

**TypeScript Identifiers:**
- Types/Interfaces: `PascalCase` (e.g., `Cafe`, `CafeSummary`, `CafeListParams`)
- Functions: `camelCase` (e.g., `transformCafe()`, `getLocalizedText()`, `fetchCafes()`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `RATING_DIMENSIONS`, `CAFE_TYPE_LABELS`)
- Variables: `camelCase` (e.g., `searchParams`, `offset`)

**Database/API:**
- Columns: `snake_case` (e.g., `cafe_type`, `has_wifi`, `overall_rating`)
- URL parameters: `camelCase` (e.g., `?minRating=4&hasWifi=true`)
- JSON keys in responses: `camelCase` (after transformation)

## Where to Add New Code

**New Feature (e.g., Favorites):**
- Primary code: `src/app/api/users/me/favorites/route.ts` (API endpoint)
- Page component: `src/app/(main)/profile/favorites/page.tsx`
- Types: Add interfaces to `src/types/user.ts`
- Tests: Would go in co-located `.test.ts` files (not currently used)

**New Component/Module:**
- UI component: `src/components/[domain]/your-component.tsx`
- Shared utility: `src/lib/[category]/your-helper.ts`
- Example: New filter type → `src/components/filter/new-filter.tsx` + type definition in `src/types/api.ts`

**New API Endpoint:**
- Path: `src/app/api/[resource]/route.ts` (or `[id]/route.ts` for single items)
- Pattern: Copy `src/app/api/cafes/route.ts` structure; create client, build query, transform, return
- Include transformer in `src/lib/supabase/transforms.ts` if needed

**Constants/Lookup Data:**
- Shared lists: `src/lib/constants/[domain].ts`
- Example: `src/lib/constants/districts.ts` for district/neighborhood lookups
- Example: Label mappings in `src/types/cafe.ts` (RATING_DIMENSIONS, CAFE_TYPE_LABELS)

**Utilities:**
- General helpers: `src/lib/utils.ts`
- Domain-specific: `src/lib/[category]/[name].ts`
- Example: All transforms in `src/lib/supabase/transforms.ts`

## Special Directories

**`supabase/`:**
- Purpose: Supabase configuration and database migrations
- Generated: No (manually managed)
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (by `next build`)
- Committed: No (in .gitignore)

**`node_modules/`:**
- Purpose: NPM dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in .gitignore)

**`public/`:**
- Purpose: Static files served at root `/`
- Generated: No (manually managed)
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning documents and codebase analysis
- Generated: Yes (by GSD commands)
- Committed: Yes (enables version control of planning)

---

*Structure analysis: 2026-01-27*
