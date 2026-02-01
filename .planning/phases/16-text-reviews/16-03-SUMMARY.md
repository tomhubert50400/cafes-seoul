---
phase: 16-text-reviews
plan: 03
subsystem: reviews
tags: [components, optimistic-ui, i18n, cafe-detail]
requires: [16-02]
provides: [cafe-review-card, cafe-reviews-list, helpful-button]
affects: [16-04]
tech-stack:
  added: []
  patterns: [useOptimistic-toggle, avatar-display-reuse, whitespace-pre-line]
key-files:
  created:
    - src/components/reviews/helpful-button.tsx
    - src/components/reviews/cafe-review-card.tsx
    - src/components/reviews/cafe-reviews-list.tsx
  modified:
    - src/app/cafes/[slug]/page.tsx
    - src/components/cafe-detail/cafe-detail-content.tsx
    - src/lib/i18n/translations.ts
decisions:
  - id: 16-03-01
    decision: Use AvatarDisplay component from profile module
    rationale: Reuses existing avatar logic with color hash and fallback initials
  - id: 16-03-02
    decision: Separate textReviews prop vs legacy reviews
    rationale: Maintains backward compatibility with existing reviews table
  - id: 16-03-03
    decision: Reviews tab shows text reviews prominently with count badge
    rationale: New text review system is primary, legacy reviews are secondary
metrics:
  duration: 5m 31s
  completed: 2026-02-01
---

# Phase 16 Plan 03: Review Display Components Summary

Client components for displaying text reviews on cafe detail page with helpful voting.

## What Was Built

### HelpfulButton Component (`src/components/reviews/helpful-button.tsx`)

Optimistic toggle button following FavoriteButton pattern:

- `useState` for actual state synced with server
- `useOptimistic` for instant UI feedback before server response
- `useTransition` for isPending state during async operation
- `justToggled` state with animation on toggle (prevents initial render bounce)
- Disabled states for own reviews and logged-out users with tooltip reasons
- ThumbsUp icon (filled when voted), count display when > 0

### CafeReviewCard Component (`src/components/reviews/cafe-review-card.tsx`)

Individual review card for cafe page display:

- Header: AvatarDisplay + author name + overall score pill + date
- Author name links to `/user/[id]` when profilePublic is true
- Review text with `whitespace-pre-line` for line break preservation
- Edited badge with pencil icon and edit date tooltip
- HelpfulButton with proper disabled states based on userId

### CafeReviewsList Component (`src/components/reviews/cafe-reviews-list.tsx`)

List wrapper for cafe reviews:

- Filters reviews to only those with text
- Empty state with MessageSquare icon and prompt message
- Maps reviews to CafeReviewCard components

### Cafe Page Integration

Updated `src/app/cafes/[slug]/page.tsx`:

- Imports getCafeReviewsAction from reviews actions
- Fetches text reviews for cafe using the action
- Passes textReviews to CafeDetailContent

Updated `src/components/cafe-detail/cafe-detail-content.tsx`:

- Added textReviews prop of type ReviewWithAuthor[]
- Reviews tab now shows text reviews section with count badge
- CafeReviewsList renders the text reviews
- Legacy reviews (from reviews table) shown below if they exist

### Translations

Added `reviews.cafe.*` keys to all 5 languages:

| Key | EN | KO | FR | ZH | VI |
|-----|----|----|----|----|-----|
| title | Reviews | 리뷰 | Avis | 评价 | Danh gia |
| noReviews | No reviews yet... | 아직 리뷰가 없습니다... | Pas encore d'avis... | 暂无评价... | Chua co danh gia... |
| edited | Edited | 수정됨 | Modifie | 已编辑 | Da chinh sua |
| cannotVoteOwn | Cannot vote... | 본인 리뷰에는... | Vous ne pouvez pas... | 不能为自己的... | Khong the bau chon... |
| loginToVote | Login to vote | 로그인하여 투표하기 | Connectez-vous... | 登录后投票 | Dang nhap de bau chon |

## Key Implementation Details

### Optimistic Toggle Pattern

```typescript
const [isVoted, setIsVoted] = useState(initialVoted);
const [optimisticIsVoted, setOptimisticIsVoted] = useOptimistic(isVoted);
const [isPending, startTransition] = useTransition();

startTransition(async () => {
  setOptimisticIsVoted(!optimisticIsVoted);
  const result = await toggleHelpfulAction(ratingId);
  if (result.success) {
    setIsVoted(result.isVoted);
  }
  // useOptimistic auto-reverts on error
});
```

### Avatar Reuse

```typescript
<AvatarDisplay
  userId={review.author.id}
  displayName={review.author.displayName}
  avatarUrl={review.author.avatarUrl}
  size="sm"
/>
```

### Conditional Profile Link

```typescript
{review.author.profilePublic ? (
  <Link href={`/user/${review.author.id}`} className="hover:underline">
    {authorName}
  </Link>
) : (
  <span>{authorName}</span>
)}
```

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 16-03-01 | Reuse AvatarDisplay from profile module | Consistent avatar handling with color hash fallback |
| 16-03-02 | Separate textReviews prop from reviews | Backward compat with legacy reviews table |
| 16-03-03 | Reviews tab shows text reviews with count badge | Text reviews are primary system |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| ef923de | feat(16-03): add HelpfulButton component with optimistic toggle |
| b122d5c | feat(16-03): add CafeReviewCard component for individual review |
| 6d05727 | feat(16-03): integrate cafe reviews list into cafe detail page |
| 2ad7386 | feat(16-03): add CafeReviewsList and cafe page integration |

## Verification Results

- [x] npm run build succeeds
- [x] HelpfulButton has optimistic toggle behavior (useState + useOptimistic + useTransition)
- [x] CafeReviewCard displays author avatar, name, score, text, date
- [x] Edited badge appears when reviewEditedAt exists
- [x] HelpfulButton shows count when > 0
- [x] Author name links to public profile when profilePublic is true
- [x] CafeReviewsList shows empty state when no reviews
- [x] Cafe page integration complete (fetches via getCafeReviewsAction)
- [x] All 5 language files have new translations

## Next Phase Readiness

Ready for 16-04 (Edit Reviews in My Reviews):
- Review display components established
- HelpfulButton pattern can be referenced for other toggles
- CafeReviewCard pattern shows how to use ReviewWithAuthor type
- Translations structure for reviews.cafe.* keys in place

---
*Completed: 2026-02-01 | Duration: 5m 31s*
