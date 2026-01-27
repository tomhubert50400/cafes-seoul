# Codebase Concerns

**Analysis Date:** 2026-01-27

## Tech Debt

**Hardcoded Secrets in Version Control:**
- Issue: The `.env.example` file contains actual Supabase and Kakao API keys instead of placeholder values
- Files: `/c/Users/t/Desktop/Projects/cafes-seoul/.env.example`
- Impact: Credentials are exposed in git history and accessible to anyone cloning the repository. These must be rotated immediately.
- Fix approach: Replace all keys in `.env.example` with dummy placeholders (e.g., `your_supabase_url_here`). Create separate secure documentation for developers on how to obtain real credentials.

**Inconsistent API Field Naming Between Routes:**
- Issue: Some API routes use `name_ko`/`name_en` fields directly (e.g., `/api/cafes/nearby`, `/api/cafes/search`) while others rely on transforms using `name` field
- Files:
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/cafes/nearby/route.ts` (line 57-58: name_ko, name_en)
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/cafes/route.ts` (lines 39-40: uses direct field selection)
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/cafes/search/route.ts` (lines 25-26: name_ko, name_en)
- Impact: Potential field mismatches when consumers expect consistent naming. The `transformCafeSummary` function expects a unified `name` field, but some routes provide `name_ko`/`name_en`.
- Fix approach: Audit all routes to use consistent database field selection. Either all routes should select `name` (JSONB) or all should select `name_ko`/`name_en` separately, with consistent transformation downstream.

**Type Casting Without Validation:**
- Issue: Frequent use of `as` assertions and unsafe type casting without runtime validation
- Files:
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/lib/supabase/transforms.ts` (lines 18-64: extensive `as` casts)
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/cafes/route.ts` (line 20: cast without validation)
- Impact: Silent failures if database returns unexpected data types. Runtime type errors could occur when transforms receive malformed data.
- Fix approach: Implement runtime validation using Zod schemas before transforms. Validate at API route level before passing to transforms.

**Missing Input Validation on Query Parameters:**
- Issue: parseInt/parseFloat calls without NaN checks on user input
- Files:
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/cafes/route.ts` (lines 14-15: `parseInt` without NaN validation)
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/cafes/nearby/route.ts` (line 12: radius could be NaN)
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/cafes/[id]/reviews/route.ts` (lines 16-17: page/limit parsing)
- Impact: Invalid query parameters silently become 0 or NaN, causing incorrect pagination or invalid database queries.
- Fix approach: Add explicit NaN validation after parseInt/parseFloat. Use Math.max with valid minimums.

**Potential SQL Injection in Search Query:**
- Issue: Search query string is directly interpolated into Supabase filter without escaping
- Files: `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/cafes/search/route.ts` (line 43)
- Code: `.or(\`name_ko.ilike.%${q}%,name_en.ilike.%${q}%,address_ko.ilike.%${q}%,specialties.cs.{${q}}\`)`
- Impact: While Supabase RLS may provide some protection, unescaped user input in filter expressions could enable injection attacks. The `specialties.cs.{${q}}` part is particularly risky.
- Fix approach: Use parameterized queries or ensure Supabase client properly escapes values. Add input sanitization for special characters in search terms.

## Security Considerations

**Missing CORS Configuration:**
- Risk: API routes may be accessible from any origin if CORS is not configured
- Files: All files in `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/**`
- Current mitigation: Next.js handles same-origin requests, but explicit configuration is missing
- Recommendations: Add explicit CORS middleware or configure allowed origins. Document which endpoints are public vs. authenticated-required.

**Authentication/Authorization Not Implemented:**
- Risk: No auth checks on write operations (reviews, ratings) visible in current API routes
- Files:
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/cafes/[id]/reviews/route.ts` (GET only, no POST)
  - Middleware exists but no auth validation shown in routes
- Current mitigation: Review mutation endpoints not implemented yet, but structure suggests they're planned
- Recommendations: Implement auth checks before allowing user submissions. Validate user ownership of reviews before allowing updates/deletes.

**Exposed Database Errors:**
- Risk: Database error messages are returned directly to clients
- Files: Multiple API routes return `error.message` directly (e.g., `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/cafes/route.ts` line 127)
- Impact: Detailed error messages leak database schema and sensitive information
- Recommendations: Log full errors server-side, return generic "Error processing request" to clients. Implement proper error logging to monitoring service.

**No Rate Limiting:**
- Risk: API endpoints have no rate limiting, enabling abuse/DoS
- Files: All API routes lack rate limiting
- Impact: Search and nearby endpoints could be hammered without restriction
- Recommendations: Implement rate limiting middleware per IP or user. Use libraries like `Ratelimit` or Upstash Redis.

## Performance Bottlenecks

**N+1 Query Problem in Reviews Endpoint:**
- Problem: Fetches reviews, then fetches votes separately for each user
- Files: `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/cafes/[id]/reviews/route.ts` (lines 71-84)
- Cause: Reviews query (line 63) doesn't include vote data, then separate query fetches votes (lines 73-77)
- Improvement path: Use Supabase join to fetch review_votes in single query, or cache votes at DB level with review aggregate

**Large Translation File Not Lazy-Loaded:**
- Problem: `translations.ts` is 658 lines and likely loaded on every language switch
- Files: `/c/Users/t/Desktop/Projects/cafes-seoul/src/lib/i18n/translations.ts`
- Cause: Monolithic translation object for all languages and keys
- Improvement path: Split translations by language into separate files, use dynamic imports for languages not initially required

**No Caching on API Responses:**
- Problem: Cafe listing and detail endpoints have no cache headers
- Files: All routes in `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/cafes/`
- Cause: Every request queries database, no revalidation strategy
- Improvement path: Add ISR (Incremental Static Revalidation) for cafe details, implement Redis caching for listing with TTL

**Inefficient Image Handling:**
- Problem: Gallery renders all images even if not visible
- Files: `/c/Users/t/Desktop/Projects/cafes-seoul/src/components/cafe-detail/cafe-detail-content.tsx` (lines 60-86)
- Cause: Maps directly to Image components without lazy loading beyond initial one
- Improvement path: Use Image lazy loading prop, implement intersection observer for off-screen images

## Fragile Areas

**Cafe Detail Content Component:**
- Files: `/c/Users/t/Desktop/Projects/cafes-seoul/src/components/cafe-detail/cafe-detail-content.tsx` (441 lines)
- Why fragile: Monolithic component handling rendering, i18n, data formatting. Breaking changes to cafe type or feature properties ripple through entire component.
- Safe modification: Extract sections into smaller sub-components (HeaderSection, FeaturesSection, RatingsSection). Use dedicated formatters for price/type labels.
- Test coverage: No test files found for component; untested props handling and edge cases

**Type Definition Complexity:**
- Files: `/c/Users/t/Desktop/Projects/cafes-seoul/src/types/cafe.ts` (200+ lines with nested types)
- Why fragile: TranslatedText is generic Record<string, string>, prone to runtime mismatches. RatingBreakdown has many optional nulls.
- Safe modification: Use stricter literal types for language keys, add validation schemas that match DB contracts
- Test coverage: No schema validation tests present

**Search Query Construction:**
- Files: `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/cafes/search/route.ts` (lines 43)
- Why fragile: Dynamic string interpolation for filters; changing field names breaks silently. Special characters in search could cause parsing errors.
- Safe modification: Build filter strings programmatically with helper functions, validate against known field names
- Test coverage: No validation of filter format or special character handling

**Supabase Transform Logic:**
- Files: `/c/Users/t/Desktop/Projects/cafes-seoul/src/lib/supabase/transforms.ts` (173 lines)
- Why fragile: Assumes all DB rows have expected fields; crashes on missing fields. parseFloat fallback to 0 can hide data issues.
- Safe modification: Add validation wrapper, use Zod schemas to guarantee shape before transform
- Test coverage: Zero tests; silent failures when DB schema changes

## Scaling Limits

**Single Monolithic Translations Object:**
- Current capacity: All languages/strings loaded upfront (658 lines)
- Limit: As more languages/features added, memory impact grows, startup time increases
- Scaling path: Implement lazy-loaded translation modules per language, use i18next or similar library with better chunking

**No Database Query Optimization:**
- Current capacity: Can handle ~50 cafes per page, joins on reviews/images without indexes
- Limit: 1000+ cafes would require pagination optimization and query performance tuning
- Scaling path: Add database indexes on `cafe_id`, `status`, implement materialized views for aggregate ratings

**Image Storage in Single Bucket:**
- Current capacity: All cafe images in `cafe-images` bucket without organization
- Limit: As image count grows, listing bucket contents becomes slow
- Scaling path: Organize bucket by cafe ID prefix (cafe-images/cafe-uuid-1/image-1.jpg), implement CDN caching

## Dependencies at Risk

**Supabase Client Library:**
- Risk: Direct dependency on Supabase SDK for auth, database, storage. No abstraction layer.
- Impact: Breaking changes in SDK require updates across entire codebase
- Migration plan: Create abstraction layer (e.g., `src/lib/db.ts`) wrapping Supabase calls, enabling future migration to different backend

**React Query (TanStack Query):**
- Risk: All async state management relies on React Query; version updates could break cache behavior
- Impact: Caching strategy and data freshness tightly coupled to Query version
- Migration plan: Keep Query interfaces abstracted, monitor deprecation notices in upgrades

## Missing Critical Features

**No Offline Support:**
- Problem: App requires connectivity for all data; cached pages not generated
- Blocks: PWA functionality, offline cafe browsing
- Priority: Medium (can enhance UX but not core requirement)

**No Error Boundaries:**
- Problem: No error boundary components wrapping route handlers
- Blocks: One component crash could crash entire page
- Priority: High (should implement immediately for stability)

**No Form Validation Framework:**
- Problem: Review submission would need inline validation (not visible in current code)
- Blocks: User input validation patterns not standardized
- Priority: High (needed before review submission feature)

## Test Coverage Gaps

**Zero Unit Tests:**
- What's not tested: All API routes, transforms, utility functions
- Files:
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/app/api/**` (all routes untested)
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/lib/supabase/transforms.ts`
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/lib/i18n/**`
- Risk: Silent failures in search, nearby endpoints. Transform bugs undetected. i18n fallbacks untested.
- Priority: High

**Zero Component Tests:**
- What's not tested: UI rendering, filter interactions, image gallery behavior
- Files:
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/components/cafe-detail/cafe-detail-content.tsx`
  - `/c/Users/t/Desktop/Projects/cafes-seoul/src/components/search-filters.tsx`
- Risk: UI breaking changes not caught during refactoring
- Priority: Medium

**No Integration Tests:**
- What's not tested: Full search flow, cafe detail page with real data, filter combinations
- Risk: Filter edge cases (empty results, special characters, pagination boundaries)
- Priority: Medium

---

*Concerns audit: 2026-01-27*
