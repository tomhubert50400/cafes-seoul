---
phase: 16-text-reviews
plan: 04
subsystem: reviews
tags: [inline-edit, react-hook-form, zod, character-counter, dialog]
requires: [16-02]
provides: [review-edit-ui, review-delete-dialog, inline-editing]
affects: []
tech-stack:
  added: []
  patterns: [inline-edit-form, confirmation-dialog, character-counter-on-typing]
key-files:
  created:
    - src/components/reviews/review-edit-form.tsx
    - src/components/reviews/delete-review-text-dialog.tsx
  modified:
    - src/components/reviews/review-card.tsx
    - src/lib/i18n/translations.ts
    - src/types/ratings.ts
    - src/lib/supabase/transforms.ts
decisions:
  - id: 16-04-01
    decision: Character counter visible only when typing
    rationale: Follows 15-03 pattern for cleaner UI with less visual noise
  - id: 16-04-02
    decision: Extend UserRating type with reviewText and reviewEditedAt
    rationale: Simpler than creating new type, data already in cafe_ratings table
metrics:
  duration: 4m 45s
  completed: 2026-02-01
---

# Phase 16 Plan 04: Inline Edit UI Components Summary

Inline editing and delete confirmation UI for review text from My Reviews tab.

## What Was Built

### ReviewEditForm Component (`src/components/reviews/review-edit-form.tsx`)

Inline form for editing review text with validation:

- react-hook-form with Zod validation (500 char max)
- Character counter shown only when text is entered (15-03 pattern)
- Textarea with min-h-[100px], resize-none
- Save/Cancel buttons with loading state
- Calls updateReviewTextAction for persistence
- Toast notifications for success/error

### DeleteReviewTextDialog Component (`src/components/reviews/delete-review-text-dialog.tsx`)

Confirmation dialog before deleting review text:

- AlertDialog following delete-account-dialog pattern
- Destructive styling for delete action
- Clear messaging: "removes text but keeps rating, removes helpful votes"
- Loading state with isPending prop
- Screen reader accessible with sr-only labels

### Enhanced ReviewCard Component (`src/components/reviews/review-card.tsx`)

Added inline edit functionality to existing card:

- Edit mode with isEditing state
- Review text display with Edited badge when reviewEditedAt exists
- Edit button (Pencil icon) enters inline edit mode
- Delete button with DeleteReviewTextDialog confirmation
- "Add a review" button for ratings without text
- Expanded max-height increased to 800px for edit form
- Click on header disabled when editing

### Type Updates

Extended UserRating interface with review fields:
```typescript
reviewText: string | null;
reviewEditedAt: string | null;
```

Updated transformUserRating to include these fields.

### Translations (5 languages)

Added 18 new translation keys for all languages:
- EN, KO, FR, ZH, VI
- Keys: addReview, editReview, deleteReview, yourReview, edited, reviewSaved, reviewDeleted, saveError, deleteError, deleteTitle, deleteDescription, reviewPlaceholder, charactersRemaining, save, cancel, saving, delete, deleting

## Key Implementation Details

### Character Counter Pattern (15-03)

```typescript
const reviewTextValue = form.watch('reviewText') || '';
const charactersRemaining = 500 - reviewTextValue.length;

{reviewTextValue.length > 0 && (
  <p className="text-xs text-muted-foreground text-right">
    {t('reviews.card.charactersRemaining').replace('{count}', String(charactersRemaining))}
  </p>
)}
```

### Edit Mode Flow

```typescript
const handleEditClick = (e: React.MouseEvent) => {
  e.stopPropagation(); // Prevent card expansion toggle
  setIsEditing(true);
  if (!expanded) setExpanded(true);
};
```

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 16-04-01 | Character counter visible only when typing | Follows 15-03 pattern for cleaner UI |
| 16-04-02 | Extend UserRating type vs new type | Simpler approach, data already in table |

## Deviations from Plan

### [Rule 3 - Blocking] Committed uncommitted 16-03 files

- **Found during:** Task 3
- **Issue:** cafe-reviews-list.tsx and page integration from 16-03 were uncommitted
- **Fix:** Committed 16-03 remnants before proceeding with 16-04
- **Files:** src/app/cafes/[slug]/page.tsx, src/components/cafe-detail/cafe-detail-content.tsx, src/components/reviews/cafe-reviews-list.tsx
- **Commit:** 6d05727

## Commits

| Hash | Message |
|------|---------|
| 90721eb | feat(16-04): add ReviewEditForm component with character counter |
| ddd061f | feat(16-04): add DeleteReviewTextDialog component |
| 982b15f | feat(16-04): enhance ReviewCard with inline edit functionality |

## Verification Results

- [x] npm run build succeeds
- [x] ReviewEditForm validates 500 char max
- [x] Character counter shows remaining chars (when typing)
- [x] DeleteReviewTextDialog confirms before delete
- [x] ReviewCard has edit/delete/add-review functionality
- [x] Edited badge displays when reviewEditedAt exists
- [x] All 5 language files updated
- [x] Min line counts met (94, 68, 239 lines)
- [x] Key links verified (isEditing -> ReviewEditForm, updateReviewTextAction)

## Next Phase Readiness

Phase 16 complete:
- Schema and types (16-01)
- Server Actions and queries (16-02)
- Review display components (16-03)
- Inline edit UI (16-04)

Ready for Phase 17 or deployment.

---
*Completed: 2026-02-01 | Duration: 4m 45s*
