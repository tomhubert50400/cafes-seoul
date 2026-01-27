# Technology Stack

**Analysis Date:** 2026-01-27

## Languages

**Primary:**
- TypeScript 5.x - Application source code, type safety across frontend and backend
- JavaScript - Configuration files (postcss, eslint, next.config)
- SQL - Supabase database queries and PostGIS functions

**Secondary:**
- CSS - Styling through Tailwind CSS utility classes

## Runtime

**Environment:**
- Node.js (version specified via package.json, uses modern LTS)

**Package Manager:**
- npm - Dependency management
- Lockfile: `package-lock.json` present and maintained

## Frameworks

**Core:**
- Next.js 16.1.4 - Full-stack React framework with SSR, API routes, and file-based routing
- React 19.2.3 - UI component library and state management
- React DOM 19.2.3 - React rendering for web

**UI & Components:**
- Radix UI - Unstyled, accessible component primitives (`@radix-ui/react-avatar`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`, `@radix-ui/react-slider`, `@radix-ui/react-tabs`)
- Tailwind CSS 4.x - Utility-first CSS framework via `@tailwindcss/postcss`
- CVA (class-variance-authority) 0.7.1 - Type-safe component styling patterns

**State Management:**
- Zustand 5.0.10 - Lightweight state management store
- TanStack React Query 5.90.20 - Server state management and caching (installed but not heavily used)

**Forms & Validation:**
- Zod 4.3.6 - TypeScript-first schema validation and parsing

**Utilities:**
- clsx 2.1.1 - Utility for constructing className strings
- tailwind-merge 3.4.0 - Merges Tailwind CSS classes with proper precedence
- lucide-react 0.563.0 - Icon library with React components
- sonner 2.0.7 - Toast notification system

**Theming:**
- next-themes 0.4.6 - Dark mode/theme management for Next.js

## Key Dependencies

**Critical:**
- `@supabase/ssr` 0.8.0 - Server-side Supabase authentication and session handling
- `@supabase/supabase-js` 2.91.1 - Supabase JavaScript client for database, auth, and storage
- `next-fonts` (Google Fonts) - Typography: Geist, Geist Mono, Noto Sans KR

**Infrastructure:**
- dotenv 17.2.3 - Environment variable loading (for local development)
- tsx 4.21.0 - TypeScript executor for Node scripts

## Configuration

**Environment:**
- `.env.example` - Template for required environment variables
- `.env.local` - Local environment configuration (not committed)
- Key variables:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key for client-side requests (public)
  - `SUPABASE_SERVICE_ROLE_KEY` - Server-side service role for elevated operations (secret)
  - `NEXT_PUBLIC_KAKAO_MAP_API_KEY` - Kakao Maps API key for client-side maps (public)
  - `KAKAO_REST_API_KEY` - Kakao REST API key for server-side requests (secret)
  - `GOOGLE_TRANSLATE_API_KEY` - Google Cloud Translation API for cafe import (secret)
  - `NEXT_PUBLIC_APP_URL` - Application root URL
  - `NEXT_PUBLIC_APP_NAME` - Application name constant

**Build:**
- `tsconfig.json` - TypeScript compiler configuration with path alias `@/*` → `./src/*`
- `next.config.ts` - Next.js configuration for remote image patterns (Supabase storage)
- `postcss.config.mjs` - PostCSS configuration with Tailwind CSS plugin
- `eslint.config.mjs` - ESLint configuration extending Next.js core web vitals and TypeScript rules
- `components.json` - Likely Shadcn/UI or component CLI configuration

## Platform Requirements

**Development:**
- Node.js (LTS recommended, as per package.json)
- npm (included with Node.js)
- TypeScript 5.x knowledge
- Modern browser with ES2017+ support

**Production:**
- Vercel (Next.js native deployment target) or Node.js server capable of running Next.js
- Supabase account with database and storage bucket configured
- Kakao Maps API account
- Google Cloud Translation API credentials (optional for cafe import scripts)

---

*Stack analysis: 2026-01-27*
