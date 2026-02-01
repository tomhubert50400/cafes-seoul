# Phase 13: Profile Foundation - Research

**Researched:** 2026-02-01
**Domain:** User Review History Display (Next.js Server Components + Supabase)
**Confidence:** HIGH

## Summary

This phase builds on the existing ratings infrastructure to display a user's complete rating history. The research investigated the existing codebase patterns for displaying lists, fetching user ratings, and implementing sorting/filtering UI.

The project already has robust infrastructure in place:
- `getUserRatings()` function in `src/lib/supabase/ratings.ts` fetches ratings with joined cafe data
- `getMyRatings()` Server Action wraps this for authenticated access
- Existing UI patterns in submissions list (`MySubmissionsList`, `SubmissionStatusCard`) demonstrate card-based display with expansion
- Radix UI Slider component already exists at `src/components/ui/slider.tsx`
- Radix UI Select component available for sorting controls

The implementation requires extending the existing data fetching to include cafe images for thumbnails, building review-specific card components with expand/collapse, and adding client-side sort/filter state management.

**Primary recommendation:** Extend `getUserRatings()` to join cafe_images, create `ReviewCard` component following `SubmissionStatusCard` pattern with expand state, and implement client-side filtering with URL-persisted sort state.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.x | Page structure, Server Components | Project standard |
| @supabase/ssr | current | Database queries with auth | Project standard |
| Radix UI Slider | current | Min score filter slider | Already installed |
| Radix UI Select | current | Sort dropdown | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | current | Icons (Star, ChevronDown, etc.) | Project standard |
| next/image | built-in | Cafe thumbnail display | Image optimization |
| tailwind-merge | current | Conditional className merging | Via cn() utility |

### No New Dependencies Required
All required UI components are already present in the project:
- Slider: `src/components/ui/slider.tsx`
- Select: `src/components/ui/select.tsx`
- Card: `src/components/ui/card.tsx`
- Badge: `src/components/ui/badge.tsx`

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/profile/reviews/
│   └── page.tsx              # Server Component - data fetching
├── components/reviews/
│   ├── my-reviews-list.tsx   # Client - list with sort/filter state
│   ├── review-card.tsx       # Client - expandable card
│   ├── review-stats.tsx      # Server - aggregate stats display
│   └── reviews-empty-state.tsx # Server - empty/filtered-empty states
└── lib/
    └── supabase/ratings.ts   # Extend getUserRatings for images
```

### Pattern 1: Server-Fetched Data with Client Sorting/Filtering
**What:** Fetch all user ratings server-side, pass to client component that handles sort/filter in-memory
**When to use:** When data set is small (user's personal ratings, typically <100 items)
**Example:**
```typescript
// Source: Project pattern from submissions page
// app/profile/reviews/page.tsx (Server Component)
export default async function ReviewsPage() {
  const result = await getMyRatingsWithCafeDetails();
  return <MyReviewsList reviews={result.ratings ?? []} />;
}

// components/reviews/my-reviews-list.tsx (Client Component)
'use client';
export function MyReviewsList({ reviews }: Props) {
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('rating');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [minScore, setMinScore] = useState(1);

  const filtered = useMemo(() => {
    return reviews
      .filter(r => r.overall >= minScore)
      .sort((a, b) => {
        if (sortBy === 'date') {
          return sortOrder === 'desc'
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sortOrder === 'desc' ? b.overall - a.overall : a.overall - b.overall;
      });
  }, [reviews, sortBy, sortOrder, minScore]);

  return (/* ... */);
}
```

### Pattern 2: Expandable Card with In-Place Detail Reveal
**What:** Card shows summary, clicking expands to reveal full dimension breakdown
**When to use:** When detail data exists but shouldn't overwhelm the list view
**Example:**
```typescript
// Source: Project pattern adapted from SubmissionStatusCard
'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ReviewCard({ review }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Thumbnail, name, date, overall score */}
        <ChevronDown className={cn(
          "transition-transform duration-200",
          expanded && "rotate-180"
        )} />
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 animate-in fade-in slide-in-from-top-2">
          {/* All 5 dimension scores */}
        </CardContent>
      )}
    </Card>
  );
}
```

### Pattern 3: Dynamic Stats with Filter Awareness
**What:** Stats footer shows both total and filtered counts
**When to use:** When user filters data and needs context about filter impact
**Example:**
```typescript
// Stats component receives both original and filtered data
function ReviewStats({
  allReviews,
  filteredReviews
}: {
  allReviews: UserRating[];
  filteredReviews: UserRating[];
}) {
  const totalCount = allReviews.length;
  const shownCount = filteredReviews.length;
  const avgOverall = calculateAverage(filteredReviews, 'overall');

  return (
    <div className="text-sm text-muted-foreground">
      {shownCount !== totalCount && (
        <span>{shownCount} of {totalCount} reviews shown</span>
      )}
      <span>Average: {avgOverall.toFixed(1)}</span>
      {/* Per-dimension averages */}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Fetching on every filter change:** Don't re-fetch from server on sort/filter; do client-side for small datasets
- **Separate expand/collapse API calls:** Don't fetch dimension details on expand; include all data upfront
- **Missing loading states:** Don't leave content empty while filtering; use useMemo for instant updates

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slider input | Custom range input | `@radix-ui/react-slider` (already installed) | Accessibility, touch support, keyboard nav |
| Select dropdown | Native `<select>` | Radix Select (already installed) | Consistent styling, portal behavior |
| Date formatting | Manual date strings | `toLocaleDateString()` | i18n-aware, handles locales |
| Image optimization | `<img>` tag | `next/image` | Lazy loading, responsive sizing |
| Average calculation | Ad-hoc math | Helper from `src/types/ratings.ts` | `getOptionalAverage()` already handles nulls |

**Key insight:** The project already has rating calculation helpers in `src/types/ratings.ts` including `getOptionalAverage()`, `getRatedDimensions()`, and `getRatedCount()`. Use these instead of recalculating.

## Common Pitfalls

### Pitfall 1: Missing Cafe Images in Rating Query
**What goes wrong:** `getUserRatings()` joins cafe name/slug but not cafe_images, resulting in no thumbnails
**Why it happens:** Original function designed for different use case
**How to avoid:** Create new function `getUserRatingsWithImages()` that includes:
```sql
cafe:cafes!inner(
  id,
  name,
  slug,
  cafe_images(storage_path)
)
```
**Warning signs:** Review cards show placeholder icons instead of cafe photos

### Pitfall 2: RatingCafe Type Missing Image
**What goes wrong:** TypeScript error when trying to access `cafe.primaryImageUrl`
**Why it happens:** `RatingCafe` type in `src/types/ratings.ts` only has id, name, slug
**How to avoid:** Either:
1. Extend `RatingCafe` interface to include `primaryImageUrl?: string`
2. Or create new `RatingCafeWithImage` type for this use case
**Warning signs:** TypeScript compilation errors

### Pitfall 3: Empty State vs Filtered-Empty State
**What goes wrong:** Same "no reviews" message shown whether user has never rated or filter returns zero
**Why it happens:** Not distinguishing between `reviews.length === 0` and `filteredReviews.length === 0`
**How to avoid:** Pass both `hasAnyReviews` and `hasFilteredResults` to empty state component
```typescript
{reviews.length === 0 ? (
  <EmptyState type="no-reviews" />  // Encouraging, suggest cafes
) : filtered.length === 0 ? (
  <EmptyState type="no-matches" onClearFilters={clearFilters} />  // Show clear filter
) : (
  <ReviewsList reviews={filtered} />
)}
```
**Warning signs:** "Start rating cafes!" message when user just has a strict filter

### Pitfall 4: Sort Order Confusion
**What goes wrong:** "Highest rated" showing lowest first
**Why it happens:** Mixing up ascending/descending logic
**How to avoid:** Use explicit naming:
```typescript
type SortOption = 'rating-high' | 'rating-low' | 'date-new' | 'date-old';
```
**Warning signs:** User expects highest first but sees lowest

### Pitfall 5: Hydration Mismatch with useI18n
**What goes wrong:** Server/client mismatch because language detected differently
**Why it happens:** Server reads cookie directly, client initializes to default then updates
**How to avoid:**
1. Use server-side `getLanguageFromCookies()` pattern (see existing pages)
2. Pass initial language to client if needed
3. Or use client components only for interactive parts
**Warning signs:** Flash of wrong language, console hydration warnings

## Code Examples

Verified patterns from the existing codebase:

### Extending Supabase Query for Cafe Images
```typescript
// Source: Pattern from src/app/api/cafes/route.ts lines 53-54
// In lib/supabase/ratings.ts - extend getUserRatings

export async function getUserRatingsWithCafeDetails(
  supabase: SupabaseClient,
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<UserRatingWithCafe[]> {
  let query = supabase
    .from('cafe_ratings')
    .select(`
      *,
      cafe:cafes!inner(
        id,
        name,
        slug,
        cafe_images(storage_path)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // ... pagination logic

  return data.map(row => ({
    ...transformUserRating(row),
    cafe: {
      ...transformRatingCafe(row.cafe),
      primaryImageUrl: getStorageUrl(row.cafe?.cafe_images?.[0]?.storage_path || null)
    }
  }));
}
```

### Slider for Minimum Score Filter
```typescript
// Source: src/components/ui/slider.tsx (Radix-based)
import { Slider } from '@/components/ui/slider';

function ScoreFilter({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">Min score:</span>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={5}
        step={1}
        className="w-32"
      />
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
```

### Sort Select Dropdown
```typescript
// Source: src/components/ui/select.tsx pattern
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function SortSelect({ value, onChange, t }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t('reviews.sortBy')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="rating-high">{t('reviews.sort.ratingHigh')}</SelectItem>
        <SelectItem value="rating-low">{t('reviews.sort.ratingLow')}</SelectItem>
        <SelectItem value="date-new">{t('reviews.sort.dateNew')}</SelectItem>
        <SelectItem value="date-old">{t('reviews.sort.dateOld')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### Language-Aware Date Formatting
```typescript
// Source: Project pattern from submissions
function formatReviewDate(dateString: string, language: LanguageCode): string {
  return new Date(dateString).toLocaleDateString(
    language === 'ko' ? 'ko-KR' : language === 'zh' ? 'zh-CN' : language === 'vi' ? 'vi-VN' : language === 'fr' ? 'fr-FR' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );
}
```

### Card Expand Animation
```typescript
// Source: Tailwind animate utilities used elsewhere in project
<CardContent
  className={cn(
    "overflow-hidden transition-all duration-200",
    expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
  )}
>
  {/* dimension scores */}
</CardContent>

// Or using CSS animation classes
<CardContent className="animate-in fade-in slide-in-from-top-2 duration-200">
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side filtering with reloads | Client-side useMemo filtering | Project standard | Instant filter response |
| Custom modals for details | In-place card expansion | CONTEXT.md decision | Simpler UX, no modal stacking |
| Prominent header stats | Subtle footer stats | CONTEXT.md decision | Less visual clutter |

**Project constraints from CONTEXT.md:**
- Default sort: Highest rated first (not newest)
- Expand card for details; separate "View cafe" button for navigation
- Stats in footer, not header
- Empty state shows 2-3 popular cafes as suggestions

## Open Questions

1. **Popular Cafes for Empty State**
   - What we know: Need to show 2-3 popular cafes when user has no reviews
   - What's unclear: How to define "popular" - highest rated? most reviews? featured?
   - Recommendation: Use top 3 by total_ratings from cafes table; simple query

2. **Illustrations for Empty States**
   - What we know: CONTEXT.md specifies "illustration + encouraging message"
   - What's unclear: What illustration assets exist or should be created
   - Recommendation: Use lucide-react icons initially (Coffee, Star, MapPin); can enhance later

3. **URL State Persistence for Sort/Filter**
   - What we know: Better UX to preserve filter state in URL
   - What's unclear: Whether this complexity is needed for Phase 13
   - Recommendation: Start with React state; URL persistence can be Phase 14+ enhancement

## Sources

### Primary (HIGH confidence)
- `src/lib/supabase/ratings.ts` - Existing getUserRatings function
- `src/lib/actions/ratings.ts` - Server Actions for ratings
- `src/types/ratings.ts` - UserRating type, dimension labels, helper functions
- `src/app/profile/submissions/page.tsx` - List page pattern
- `src/components/submissions/submission-status-card.tsx` - Card component pattern
- `src/components/ui/slider.tsx` - Radix Slider already installed
- `src/components/ui/select.tsx` - Radix Select already installed
- `src/app/api/cafes/route.ts` - Pattern for joining cafe_images

### Secondary (MEDIUM confidence)
- `supabase/migrations/0801_cafe_ratings.sql` - Table schema, indexes

### Tertiary (LOW confidence)
- None - all findings verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components already in project
- Architecture: HIGH - Following existing patterns
- Pitfalls: HIGH - Identified from codebase analysis
- Data layer: HIGH - Existing functions need minor extension

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable domain)
