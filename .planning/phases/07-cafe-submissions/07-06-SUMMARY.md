---
phase: 07-cafe-submissions
plan: 06
subsystem: database
tags: [postgresql, pg_trgm, rpc, fuzzy-matching, gin-index, similarity]

# Dependency graph
requires:
  - phase: 07-cafe-submissions
    provides: Cafe submissions table and TypeScript client calling RPC
provides:
  - find_duplicate_cafes RPC function using pg_trgm
  - GIN trigram indexes for fast similarity search
  - Fuzzy duplicate detection with similarity scores
  - Gap closure for missing RPC referenced by submissions.ts
affects:
  - Phase 8+ (any phase using duplicate detection)

# Tech tracking
tech-stack:
  added: [pg_trgm PostgreSQL extension]
  patterns:
    - "Fuzzy matching with pg_trgm similarity() function"
    - "GIN trigram indexes for text search performance"
    - "RPC functions with SECURITY DEFINER for controlled access"
    - "JSONB return types for translated content"

key-files:
  created:
    - supabase/migrations/0702_duplicate_detection_rpc.sql
  modified: []

key-decisions:
  - "Function accepts search_name and search_address as separate TEXT params (not JSON-stringified) to match actual TypeScript client usage"
  - "Similarity threshold of 0.3 (30%) for name matching balances precision and recall"
  - "Address similarity threshold of 0.4 (40%) for secondary matching to reduce false positives"
  - "GIN trigram indexes on both Korean and English name/address columns for performance"
  - "Returns JSONB objects for name/address to match CafeSummary TypeScript type"
  - "Match type distinguishes 'name' vs 'name_address' for UI differentiation"

# Metrics
duration: 1min
completed: 2026-01-30
---

# Phase 7 Plan 6: pg_trgm RPC for Fuzzy Duplicate Detection Summary

**PostgreSQL RPC function with pg_trgm extension enabling fuzzy cafe duplicate detection using trigram similarity matching and GIN indexes**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-30T16:27:42Z
- **Completed:** 2026-01-30T16:28:58Z
- **Tasks:** 1/1
- **Files modified:** 1

## Accomplishments

- Created `find_duplicate_cafes(search_name TEXT, search_address TEXT, max_results INTEGER)` RPC function
- Enabled pg_trgm PostgreSQL extension for trigram-based fuzzy matching
- Implemented similarity scoring using `similarity()` function on both Korean and English names
- Added 4 GIN trigram indexes for performance (name_ko, name_en, address_ko, address_en)
- Set configurable similarity thresholds (0.3 for names, 0.4 for addresses)
- Returns structured results with id, name (JSONB), address (JSONB), similarity_score, and match_type
- Granted execute permissions to authenticated and anon roles

## Task Commits

Each task was committed atomically:

1. **Task 1: Create pg_trgm RPC Migration** - `ecbaae4` (feat)

**Plan metadata:** To be committed with STATE.md update

## Files Created/Modified

- `supabase/migrations/0702_duplicate_detection_rpc.sql` - Database migration creating:
  - pg_trgm extension enablement
  - GIN trigram indexes on cafes table (name_ko, name_en, address_ko, address_en)
  - find_duplicate_cafes() RPC function with fuzzy matching
  - Function grants for authenticated/anon users
  - Documentation comments and verification queries

## Decisions Made

1. **Function signature aligned with actual usage**: The TypeScript code in `submissions.ts` calls `supabase.rpc('find_duplicate_cafes', { search_name, search_address, max_results })`, so the function accepts these as proper parameters rather than JSON-stringified values.

2. **Dual-language support**: The function checks similarity on both `name_ko`/`name_en` and `address_ko`/`address_en` columns using `GREATEST()` to handle cafes that may have different primary languages.

3. **Match type distinction**: Results include `match_type` ('name' or 'name_address') so the UI can differentiate between name-only matches and name+address matches for better user experience.

4. **Similarity thresholds tuned**: Name matching uses 0.3 (30%) threshold to catch variations like "Starbucks" vs "Starbuck's" while address matching uses stricter 0.4 (40%) to avoid false positives.

5. **SECURITY DEFINER**: Function runs with definer privileges to ensure consistent access to cafe data regardless of RLS policies.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Gap Closure Verification

The gap has been closed:

- ✅ `find_duplicate_cafes` RPC function now exists in database
- ✅ Uses `pg_trgm` extension with `similarity()` function for fuzzy matching
- ✅ Function returns similarity scores (REAL values 0.0-1.0)
- ✅ Results ordered by similarity_score DESC
- ✅ Configurable similarity threshold (0.3 default)
- ✅ TypeScript client in `submissions.ts` can now successfully call the RPC
- ✅ Fallback ILIKE code in `submissions.ts` will only trigger if RPC errors

## Next Phase Readiness

- Duplicate detection now uses proper fuzzy matching instead of ILIKE fallback
- Ready for Phase 8: Ratings System
- The cafe submissions system is now complete with all gap closures addressed

---
*Phase: 07-cafe-submissions*
*Completed: 2026-01-30*
