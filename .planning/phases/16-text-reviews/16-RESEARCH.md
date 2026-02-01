# Phase 16: Text Reviews - Research

**Researched:** 2026-02-01
**Domain:** Text review system with voting
**Confidence:** HIGH

## Summary

This phase adds optional text reviews and helpful voting to the existing rating system. The research focused on five key technical areas: (1) textarea validation with character limits using react-hook-form and Zod, (2) database schema for review text and helpful votes with proper RLS policies, (3) optimistic UI patterns for vote toggling using useOptimistic and useTransition, (4) inline editing with state management and confirmation dialogs, and (5) edit tracking with PostgreSQL triggers.

The project already uses the standard stack (react-hook-form + Zod, Supabase, Server Actions), so the implementation follows established patterns. The favorites table provides a proven model for the toggle voting pattern. The key architectural decision is separating review text/metadata from rating scores while maintaining the one-review-per-user-per-cafe constraint.

**Primary recommendation:** Extend the existing `cafe_ratings` table with text fields rather than creating a separate reviews table, use a separate `review_helpful_votes` junction table for voting, and follow the established favorites pattern for optimistic vote toggling.

## Standard Stack

All required libraries are already installed in the project.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.71.1 | Form state and validation | Already used for ratings, proven textarea validation with maxLength |
| zod | ^4.3.6 | Schema validation | Already used, provides string.min/max with custom error messages |
| @radix-ui/react-alert-dialog | ^1.1.15 | Confirmation dialogs | Already used for delete account, perfect for delete text confirmation |
| next (Server Actions) | 16.1.4 | Data mutations | Already used for ratings/favorites, same pattern for review actions |
| @supabase/supabase-js | ^2.93.1 | Database client | Already used, handles RLS, upsert, and voting patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | ^2.0.7 | Toast notifications | Already used, for success/error feedback after mutations |
| lucide-react | ^0.563.0 | Icons | Already used, provides edit, trash, thumbs-up icons |
| framer-motion | ^12.29.2 | Optional animations | Already installed, could enhance inline edit transitions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod | Yup | Zod is TypeScript-first and already in project |
| Server Actions | tRPC | Server Actions native to Next.js 14+, already established |
| useOptimistic | Manual state | useOptimistic handles race conditions better |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Database Schema Pattern

**Review text storage:**
```sql
-- Extend existing cafe_ratings table (not a new table)
ALTER TABLE cafe_ratings
  ADD COLUMN review_text TEXT,
  ADD COLUMN review_edited_at TIMESTAMPTZ,
  ADD CONSTRAINT review_text_length CHECK (
    review_text IS NULL OR
    LENGTH(review_text) <= 500
  );

CREATE INDEX idx_cafe_ratings_with_text
  ON cafe_ratings(cafe_id, created_at DESC)
  WHERE review_text IS NOT NULL;
```

**Voting junction table:**
```sql
-- Separate table for helpful votes (many-to-many)
CREATE TABLE review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating_id UUID NOT NULL REFERENCES cafe_ratings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, rating_id)
);

-- Index for checking if user voted
CREATE INDEX idx_helpful_votes_user_rating
  ON review_helpful_votes(user_id, rating_id);

-- Index for counting votes per review
CREATE INDEX idx_helpful_votes_rating
  ON review_helpful_votes(rating_id);
```

### Row Level Security Pattern

**Review text policies:**
```sql
-- Follows existing cafe_ratings RLS structure
-- Users can update their own review text
CREATE POLICY "Users can update own review text"
ON cafe_ratings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Voting policies:**
```sql
-- Anyone can view vote counts (via aggregation)
CREATE POLICY "Anyone can view votes"
ON review_helpful_votes FOR SELECT
USING (true);

-- Logged-in users can insert votes
CREATE POLICY "Logged-in users can vote"
ON review_helpful_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
ON review_helpful_votes FOR DELETE
USING (auth.uid() = user_id);
```

### Optimistic Voting Pattern

**Client component pattern (follows favorites exactly):**
```typescript
'use client';

function ReviewCard({ review, initialVoted, initialCount }) {
  const [isVoted, setIsVoted] = useState(initialVoted);
  const [optimisticVoted, setOptimisticVoted] = useOptimistic(isVoted);
  const [optimisticCount, setOptimisticCount] = useOptimistic(initialCount);
  const [isPending, startTransition] = useTransition();

  const handleVote = () => {
    startTransition(async () => {
      // Optimistic update
      setOptimisticVoted(!optimisticVoted);
      setOptimisticCount(optimisticVoted ? count - 1 : count + 1);

      // Server action
      const result = await toggleReviewHelpfulAction(review.id);

      if (result.success) {
        setIsVoted(result.isVoted);
        // Count updated via revalidation
      } else {
        // Rollback on error (useOptimistic handles automatically)
        toast.error(result.error);
      }
    });
  };

  return (
    <button onClick={handleVote} disabled={isPending}>
      {optimisticCount > 0 && `${optimisticCount} helpful`}
    </button>
  );
}
```

### Inline Edit Pattern

**Boolean state toggle:**
```typescript
function ReviewItem({ review }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // When entering edit mode, clone data into draft
  const [draftText, setDraftText] = useState(review.reviewText || '');

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateReviewTextAction(review.id, draftText);
      if (result.success) {
        setIsEditing(false);
        toast.success('Review updated');
      }
    });
  };

  const handleCancel = () => {
    setDraftText(review.reviewText || ''); // Revert to original
    setIsEditing(false);
  };

  if (isEditing) {
    return <ReviewEditForm text={draftText} onChange={setDraftText} />;
  }

  return <ReviewDisplay text={review.reviewText} onEdit={() => setIsEditing(true)} />;
}
```

### Edit Tracking Pattern

**PostgreSQL trigger for edit timestamp:**
```sql
-- Update review_edited_at only when review_text changes
CREATE OR REPLACE FUNCTION update_review_edited_at()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.review_text IS DISTINCT FROM OLD.review_text) THEN
    NEW.review_edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_edited_at
  BEFORE UPDATE ON cafe_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_review_edited_at();
```

### Form Validation Pattern

**Zod schema for review text:**
```typescript
// Source: Zod documentation + react-hook-form register API
const reviewTextSchema = z.object({
  reviewText: z
    .string()
    .max(500, "Review must be 500 characters or less")
    .optional()
    .or(z.literal('')), // Allow empty string to delete text
});

// In component:
const form = useForm({
  resolver: zodResolver(reviewTextSchema),
  defaultValues: { reviewText: review.reviewText || '' }
});
```

**Character counter display:**
```typescript
function ReviewTextarea({ value, onChange, maxLength = 500 }) {
  const remaining = maxLength - value.length;

  return (
    <div>
      <textarea
        value={value}
        onChange={onChange}
        maxLength={maxLength}
      />
      <span className="text-sm text-muted-foreground">
        {remaining} characters remaining
      </span>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Separate reviews table:** Don't create `reviews` table separate from `cafe_ratings`. Extends existing table to maintain one-review-per-user-per-cafe constraint.
- **Client-side only validation:** Always validate character limits on server (Zod + database constraint) not just client (maxLength attribute).
- **Storing vote counts in reviews table:** Don't add `helpful_count` column to `cafe_ratings`. Calculate via COUNT() query to avoid sync issues.
- **Not handling null text:** Review text is optional, so all queries must handle `NULL` properly (use `WHERE review_text IS NOT NULL` for display).
- **Forgetting revalidation:** After edit/delete text, must revalidate cafe page and My Reviews tab.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Character counting | Custom onChange + state | react-hook-form watch + maxLength validation | Handles validation errors, integrates with form state |
| Vote toggling | Manual state management | useOptimistic + useTransition pattern | Handles race conditions, rollback on error, pending states |
| Edit timestamp | Application-level tracking | PostgreSQL trigger on UPDATE | Server is source of truth, can't be bypassed, handles timezone |
| Confirmation dialogs | Custom modal state | Radix AlertDialog with open/onOpenChange | Accessibility, keyboard navigation, focus management |
| Form error display | Manual error state | react-hook-form formState.errors | Automatic error tracking per field, clears on fix |

**Key insight:** The existing favorites and ratings implementations already solve most patterns needed. Vote toggling matches favorites exactly, Server Actions follow the same structure, and RLS policies use identical patterns.

## Common Pitfalls

### Pitfall 1: Character Limit Validation Gaps
**What goes wrong:** Text exceeds 500 characters in database even with client validation.
**Why it happens:** Client maxLength can be bypassed, and Zod validation might not run on direct database updates.
**How to avoid:** Triple-layer validation:
1. Client: `<textarea maxLength={500} />` (UX feedback)
2. Server Action: Zod schema validates before database call
3. Database: `CHECK (review_text IS NULL OR LENGTH(review_text) <= 500)`
**Warning signs:** Database constraint violation errors in production logs.

### Pitfall 2: Vote Count Synchronization Issues
**What goes wrong:** Helpful count shows wrong number, doesn't update after vote.
**Why it happens:** Storing count in `cafe_ratings` table instead of calculating it.
**How to avoid:** Always calculate count via query:
```sql
SELECT
  cr.*,
  COUNT(rhv.id) as helpful_count
FROM cafe_ratings cr
LEFT JOIN review_helpful_votes rhv ON rhv.rating_id = cr.id
GROUP BY cr.id
```
**Warning signs:** Count doesn't match actual votes, count doesn't decrease when vote removed.

### Pitfall 3: Edit Timestamp Not Updating
**What goes wrong:** `review_edited_at` stays null or doesn't update on subsequent edits.
**Why it happens:** Trigger checks wrong condition or doesn't handle null-to-text case.
**How to avoid:** Use `IS DISTINCT FROM` in trigger to catch all changes including NULL transitions:
```sql
IF (NEW.review_text IS DISTINCT FROM OLD.review_text) THEN
  NEW.review_edited_at = NOW();
END IF;
```
**Warning signs:** All reviews show "Edited" badge or none do, timestamp doesn't change on edit.

### Pitfall 4: Users Voting on Own Reviews
**What goes wrong:** Users can mark their own review as helpful.
**Why it happens:** No check in insert policy or Server Action.
**How to avoid:** Server Action must check ownership before allowing vote:
```typescript
// In toggleReviewHelpfulAction
const { data: review } = await supabase
  .from('cafe_ratings')
  .select('user_id')
  .eq('id', ratingId)
  .single();

if (review.user_id === user.id) {
  return { success: false, error: 'Cannot vote on own review' };
}
```
**Warning signs:** Vote button visible on user's own reviews, user can click it.

### Pitfall 5: Lost Votes When Deleting Text
**What goes wrong:** Helpful votes persist after text is deleted, orphaned votes in database.
**Why it happens:** Not cascading delete when text is removed.
**How to avoid:** Server Action must delete votes when text is removed:
```typescript
if (newText === '' || newText === null) {
  // Delete all helpful votes for this review
  await supabase
    .from('review_helpful_votes')
    .delete()
    .eq('rating_id', ratingId);
}
```
**Warning signs:** Review with no text still shows helpful count, votes table grows unbounded.

### Pitfall 6: Inline Edit State Management
**What goes wrong:** Edits to one review affect other reviews, or canceling doesn't revert changes.
**Why it happens:** Sharing state across review cards, not cloning draft state.
**How to avoid:** Each review card manages its own `isEditing` state and clones text into `draftText` when entering edit mode.
**Warning signs:** Multiple edit forms open at once, cancel button doesn't work, edits persist after cancel.

## Code Examples

Verified patterns from official sources and existing project code:

### Server Action with Validation
```typescript
// Source: Existing ratings.ts pattern
'use server';

export async function updateReviewTextAction(
  ratingId: string,
  reviewText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate with Zod
    const validation = reviewTextSchema.safeParse({ reviewText });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    // Update review text
    const { error } = await supabase
      .from('cafe_ratings')
      .update({
        review_text: reviewText || null // Convert empty string to null
      })
      .eq('id', ratingId)
      .eq('user_id', user.id); // Verify ownership

    if (error) {
      return { success: false, error: error.message };
    }

    // If deleting text, remove all helpful votes
    if (!reviewText) {
      await supabase
        .from('review_helpful_votes')
        .delete()
        .eq('rating_id', ratingId);
    }

    // Revalidate paths
    revalidatePath('/profile/reviews');

    return { success: true };
  } catch (err) {
    console.error('Error updating review text:', err);
    return { success: false, error: 'Failed to update review' };
  }
}
```

### Toggle Vote Action (Similar to Favorites)
```typescript
// Source: Existing favorites.ts pattern
'use server';

export async function toggleReviewHelpfulAction(
  ratingId: string
): Promise<{ success: boolean; isVoted?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if review belongs to user (can't vote own review)
    const { data: review } = await supabase
      .from('cafe_ratings')
      .select('user_id')
      .eq('id', ratingId)
      .single();

    if (!review) {
      return { success: false, error: 'Review not found' };
    }

    if (review.user_id === user.id) {
      return { success: false, error: 'Cannot vote on own review' };
    }

    // Check if already voted
    const { data: existingVote } = await supabase
      .from('review_helpful_votes')
      .select('id')
      .eq('user_id', user.id)
      .eq('rating_id', ratingId)
      .maybeSingle();

    if (existingVote) {
      // Remove vote
      await supabase
        .from('review_helpful_votes')
        .delete()
        .eq('id', existingVote.id);

      return { success: true, isVoted: false };
    } else {
      // Add vote
      await supabase
        .from('review_helpful_votes')
        .insert({ user_id: user.id, rating_id: ratingId });

      return { success: true, isVoted: true };
    }
  } catch (err) {
    console.error('Error toggling helpful vote:', err);
    return { success: false, error: 'Failed to update vote' };
  }
}
```

### Delete Confirmation Dialog
```typescript
// Source: Existing delete-account-dialog.tsx pattern
function DeleteReviewTextDialog({ onConfirm, isPending }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete review text?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove your written review but keep your rating.
            All helpful votes will be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              setIsOpen(false);
            }}
            disabled={isPending}
          >
            Delete Text
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Query Reviews with Vote Counts
```typescript
// Source: PostgreSQL best practices for ORDER BY + JOIN aggregation
async function getCafeReviewsWithVotes(
  supabase: SupabaseClient,
  cafeId: string,
  userId?: string
) {
  let query = supabase
    .from('cafe_ratings')
    .select(`
      *,
      user:users!user_id(id, display_name, avatar_url, profile_public),
      helpful_count:review_helpful_votes(count)
    `)
    .eq('cafe_id', cafeId)
    .not('review_text', 'is', null)
    .order('created_at', { ascending: false });

  // If user logged in, check which reviews they voted
  if (userId) {
    // Separate query for user's votes (can't join in single query)
    const { data: userVotes } = await supabase
      .from('review_helpful_votes')
      .select('rating_id')
      .eq('user_id', userId);

    const votedIds = new Set(userVotes?.map(v => v.rating_id) || []);

    const { data: reviews } = await query;

    return reviews?.map(review => ({
      ...review,
      userHasVoted: votedIds.has(review.id),
      helpfulCount: review.helpful_count?.[0]?.count || 0
    }));
  }

  const { data: reviews } = await query;
  return reviews?.map(review => ({
    ...review,
    userHasVoted: false,
    helpfulCount: review.helpful_count?.[0]?.count || 0
  }));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useFormState hook | useActionState hook | React 19 (2024) | Same functionality, renamed for clarity |
| Manual optimistic state | useOptimistic hook | React 18.2+ (2023) | Built-in rollback on error, cleaner API |
| throw errors in Server Actions | Return error objects | Next.js 14 (2023) | Avoid try-catch in client, better DX |
| Text reviews in separate table | Extend ratings table | N/A (design choice) | Maintains one-review constraint, simpler queries |

**Deprecated/outdated:**
- **useFormState:** Renamed to `useActionState` in React 19, but Next.js may still document old name
- **Throwing errors from Server Actions:** Modern pattern returns `{ success: false, error: string }` instead
- **Vote count in source table:** Old Reddit-style systems stored counts, modern approach calculates on-demand

## Open Questions

Things that couldn't be fully resolved:

1. **Review sorting options beyond newest first**
   - What we know: CONTEXT.md specifies "newest first" as default
   - What's unclear: Whether to add sorting by "most helpful" or other options
   - Recommendation: Implement only newest first per CONTEXT.md, sorting options can be Phase 17+

2. **Review text internationalization**
   - What we know: App supports 5 languages (KO, EN, FR, ZH, VI)
   - What's unclear: Whether review text should be stored per-language or single field
   - Recommendation: Single field (users write in their language), no auto-translation. UI labels use i18n.

3. **Character counting: Unicode vs. bytes**
   - What we know: Zod .max() counts Unicode characters, PostgreSQL LENGTH() counts characters
   - What's unclear: Whether emojis/CJK characters count as 1 or more
   - Recommendation: Both count Unicode characters (not bytes), consistent behavior. Database constraint matches client.

## Sources

### Primary (HIGH confidence)
- React Hook Form register API - https://react-hook-form.com/docs/useform/register - Textarea validation with maxLength/minLength
- Zod Documentation - https://zod.dev/error-customization - String validation with custom error messages
- Radix UI Alert Dialog - https://www.radix-ui.com/primitives/docs/components/alert-dialog - Confirmation dialog pattern
- PostgreSQL Triggers Documentation - https://www.postgresql.org/docs/current/ - Edit timestamp triggers
- Existing project code - src/lib/actions/favorites.ts - Proven toggle pattern
- Existing project code - src/lib/actions/ratings.ts - Server Action structure
- Existing project code - src/components/profile/delete-account-dialog.tsx - AlertDialog usage

### Secondary (MEDIUM confidence)
- [React useOptimistic and useTransition hooks Explained](https://reetesh.in/blog/react-useoptimistic-and-usetransition-hooks-explained) - Toggle pattern implementation
- [Next.js Server Actions: Complete Guide with Examples for 2026](https://dev.to/marufrahmanlive/nextjs-server-actions-complete-guide-with-examples-for-2026-2do0) - Error handling patterns
- [Supabase Row Level Security (RLS): Complete Guide 2025](https://vibeappscanner.com/supabase-row-level-security) - RLS policy patterns
- [PostgreSQL ORDER BY Documentation](https://www.postgresql.org/docs/current/queries-order.html) - Sorting best practices
- [Enhancing User Experience with React Inline Edit](https://www.dhiwise.com/post/a-beginners-guide-to-implementing-react-inline-edi) - Inline editing patterns

### Tertiary (LOW confidence)
- WebSearch results on content moderation - Marked for validation, not critical to implementation
- WebSearch results on review schema - SEO-focused, not relevant to this phase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, verified in package.json
- Architecture: HIGH - Patterns proven in existing favorites/ratings code
- Pitfalls: MEDIUM-HIGH - Based on documented issues and best practices, some project-specific assumptions

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days for stable stack)
