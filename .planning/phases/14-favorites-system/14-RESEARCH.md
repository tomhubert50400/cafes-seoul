# Phase 14: Favorites System - Research

**Researched:** 2026-02-01
**Domain:** Optimistic UI with Next.js 15 App Router, Supabase junction tables, Framer Motion animations
**Confidence:** HIGH

## Summary

Researched implementation patterns for user favorites system with optimistic UI updates, heart toggle animations, and cross-view synchronization. The standard approach uses React's `useOptimistic` hook for immediate UI feedback, Supabase upsert operations with composite unique constraints, and Framer Motion for bounce animations. Key challenges include race condition handling from rapid clicks and state synchronization across multiple views.

The established pattern combines:
- **Server Actions** with `useOptimistic` for immediate UI updates that auto-rollback on error
- **Composite unique constraints** on `(user_id, cafe_id)` for favorites table integrity
- **Scale animations** with Framer Motion for satisfying heart bounce feedback
- **Transition-based debouncing** via `startTransition` to batch rapid clicks

**Primary recommendation:** Use `useOptimistic` with Server Actions for favorites toggle, implement composite unique constraint on favorites table, add scale animation to heart icon, and leverage existing patterns from ratings system for consistent architecture.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React useOptimistic | 19.2.3 | Optimistic UI updates | Built-in hook for immediate feedback with auto-rollback |
| Next.js revalidatePath | 16.1.4 | Cache invalidation | Standard Next.js pattern for syncing server state |
| Framer Motion | 12.29.2 | Heart bounce animation | Already in project stack, handles scale/spring animations |
| Supabase upsert | 2.93.1 | Favorites toggle | Atomic insert-or-delete with composite key handling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React useTransition | 19.2.3 | Transition management | Wraps async operations, provides isPending state |
| Sonner toast | 2.0.7 | Error notifications | Already used project-wide for feedback |
| Lucide React | 0.563.0 | Heart icon | Already in project, provides Heart icon component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useOptimistic | React Query mutations | More complexity, requires separate state management library setup |
| Server Actions | API Routes | More boilerplate, no automatic form integration |
| Framer Motion scale | CSS keyframes | Less control over spring physics, harder to interrupt |

**Installation:**
```bash
# All dependencies already installed in project
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── actions/
│   │   └── favorites.ts        # Server Actions for toggle/get favorites
│   ├── supabase/
│   │   └── favorites.ts        # Database queries
│   └── validations/
│       └── favorites.ts        # Zod schemas (if needed)
├── components/
│   ├── favorites/
│   │   ├── favorite-button.tsx # Reusable heart toggle button
│   │   └── favorites-list.tsx  # Profile tab favorites grid
│   └── cafe-card.tsx           # Modified to include heart icon
└── app/
    └── profile/
        └── favorites/
            └── page.tsx        # Favorites profile tab
```

### Pattern 1: Optimistic Toggle with useOptimistic
**What:** Immediate UI update that auto-reverts on server error
**When to use:** Any user action that should feel instant (likes, favorites, follows)
**Example:**
```typescript
// Source: https://react.dev/reference/react/useOptimistic
'use client';

import { useOptimistic, useTransition } from 'react';
import { toggleFavorite } from '@/lib/actions/favorites';

export function FavoriteButton({ cafeId, initialIsFavorited }) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [optimisticIsFavorited, setOptimisticIsFavorited] = useOptimistic(isFavorited);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      // Optimistic update - UI changes immediately
      setOptimisticIsFavorited(!optimisticIsFavorited);

      try {
        const result = await toggleFavorite(cafeId);
        if (result.success) {
          setIsFavorited(result.isFavorited); // Sync with server
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        // Auto-rollback already happened
        toast.error('Failed to update favorite');
      }
    });
  };

  return (
    <button onClick={handleToggle} disabled={isPending}>
      <Heart fill={optimisticIsFavorited ? 'red' : 'none'} />
    </button>
  );
}
```

### Pattern 2: Supabase Upsert for Toggle Operations
**What:** Single operation that inserts if not exists, deletes if exists
**When to use:** Favorites, likes, bookmarks - binary user preferences
**Example:**
```typescript
// Source: https://supabase.com/docs/reference/javascript/upsert
// Pattern adapted from project's ratings.ts

export async function toggleFavorite(
  supabase: SupabaseClient,
  userId: string,
  cafeId: string
): Promise<{ success: boolean; isFavorited: boolean; error?: string }> {
  // First check if favorite exists
  const { data: existing } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('cafe_id', cafeId)
    .single();

  if (existing) {
    // Delete if exists
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('cafe_id', cafeId);

    if (error) return { success: false, isFavorited: false, error: error.message };
    return { success: true, isFavorited: false };
  } else {
    // Insert if not exists
    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        cafe_id: cafeId,
      });

    if (error) return { success: false, isFavorited: true, error: error.message };
    return { success: true, isFavorited: true };
  }
}
```

### Pattern 3: Framer Motion Bounce Animation
**What:** Scale animation with spring physics for satisfying feedback
**When to use:** Toggle actions that need tactile feedback (favorites, likes)
**Example:**
```typescript
// Source: https://blog.maximeheckel.com/posts/advanced-animation-patterns-with-framer-motion/
// Pattern adapted from project's auth-motion-wrapper.tsx

import { motion } from 'framer-motion';

export function FavoriteButton({ isFavorited, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      animate={{ scale: isFavorited ? [1, 1.2, 1] : 1 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 15,
        duration: 0.3
      }}
    >
      <Heart
        fill={isFavorited ? 'currentColor' : 'none'}
        className="text-red-500"
      />
    </motion.button>
  );
}
```

### Pattern 4: Server Action with Revalidation
**What:** Server-side mutation that invalidates affected route caches
**When to use:** Any data mutation that affects multiple pages
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/revalidatePath
// Pattern from project's ratings.ts actions

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function toggleFavoriteAction(cafeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  const result = await toggleFavorite(supabase, user.id, cafeId);

  if (result.success) {
    // Invalidate caches
    revalidatePath('/profile/favorites');
    revalidatePath('/cafes');
    const { data: cafe } = await supabase
      .from('cafes')
      .select('slug')
      .eq('id', cafeId)
      .single();
    if (cafe?.slug) {
      revalidatePath(`/cafes/${cafe.slug}`);
    }
  }

  return result;
}
```

### Anti-Patterns to Avoid
- **Setting state outside transition:** Causes optimistic update to revert prematurely before server responds
- **Not using composite unique constraint:** Leads to duplicate favorites in database
- **Animating on initial render:** Shows bounce when page loads; only animate on toggle
- **Manual rollback logic:** useOptimistic handles this automatically; don't duplicate the logic

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Optimistic UI rollback | Custom pending state + error handling | React `useOptimistic` | Auto-rollback on error, handles race conditions better |
| Animation interruption | CSS transitions | Framer Motion `whileTap` + `animate` | Can interrupt mid-animation, spring physics |
| Toggle debouncing | setTimeout/lodash debounce | `useTransition` + `startTransition` | Built-in transition batching, isPending state |
| Duplicate prevention | Application-level checks | Postgres composite UNIQUE constraint | Database-level integrity, atomic operations |
| Cache invalidation | Manual refetch calls | Next.js `revalidatePath` | Invalidates all affected routes automatically |

**Key insight:** React 19 and Next.js 15 provide built-in solutions for optimistic updates that previously required third-party libraries. Use the platform primitives instead of reinventing these patterns.

## Common Pitfalls

### Pitfall 1: Race Conditions from Rapid Clicks
**What goes wrong:** User clicks heart 5 times rapidly; final state is incorrect because requests complete out of order
**Why it happens:** `useOptimistic` doesn't prevent race conditions - if user fires mutation multiple times, last-to-complete wins regardless of click order
**How to avoid:**
- Disable button while transition pending: `<button disabled={isPending}>`
- OR use transition to batch: `startTransition` naturally debounces rapid clicks
- OR implement request ID tracking (complex, usually overkill)
**Warning signs:** Heart state flickers between filled/unfilled on rapid clicks, final state doesn't match user's last click

### Pitfall 2: Missing Composite Unique Constraint
**What goes wrong:** User favorites same cafe multiple times, creating duplicate rows in database
**Why it happens:** Forgot to add UNIQUE constraint on `(user_id, cafe_id)` columns
**How to avoid:** Create constraint in migration: `ALTER TABLE user_favorites ADD CONSTRAINT user_favorites_unique UNIQUE (user_id, cafe_id);`
**Warning signs:** Favorites count increases on every click instead of toggling, database bloat

### Pitfall 3: Optimistic Update Reverts Before Server Responds
**What goes wrong:** Heart fills then immediately unfills, even though server succeeds
**Why it happens:** Awaiting API call outside `startTransition` block causes premature revert
**How to avoid:** Entire async operation (including await) must be inside `startTransition` callback
**Warning signs:** UI flickers, users report "favorites don't save"

### Pitfall 4: Animation Plays on Page Load
**What goes wrong:** Heart bounces when user navigates to page with favorited cafes
**Why it happens:** Using `animate={{ scale: [1, 1.2, 1] }}` without conditional check
**How to avoid:** Only trigger animation on state change, not initial render:
```typescript
// Use key to force re-mount on toggle, OR
// Use conditional: animate={{ scale: justToggled ? [1, 1.2, 1] : 1 }}
```
**Warning signs:** Hearts bounce annoyingly when browsing, users report "distracting animation"

### Pitfall 5: Not Handling Logged-Out Users
**What goes wrong:** Heart icon shows for logged-out users who can't favorite
**Why it happens:** Forgot to check auth state before rendering button
**How to avoid:** Per context decisions, hide heart entirely for logged-out users: `{user && <FavoriteButton />}`
**Warning signs:** Users report "clicking heart does nothing", auth errors in console

### Pitfall 6: Forgetting to Revalidate All Affected Paths
**What goes wrong:** Favorites list updates but cafe detail page still shows unfavorited
**Why it happens:** Only called `revalidatePath('/profile/favorites')`, forgot cafe detail page
**How to avoid:** Revalidate ALL paths that show favorite status:
- `/profile/favorites` (favorites list)
- `/cafes` (browse page with cafe cards)
- `/cafes/[slug]` (cafe detail page)
- `/map` (if showing favorites filter)
**Warning signs:** State inconsistency between pages, requires hard refresh to sync

## Code Examples

Verified patterns from official sources:

### Favorites Table Schema
```sql
-- Source: Supabase RLS best practices + composite unique constraint pattern
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_favorites_unique UNIQUE (user_id, cafe_id)
);

-- Indexes for performance
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_cafe_id ON user_favorites(cafe_id);

-- RLS Policies
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Complete Server Action
```typescript
// Source: Pattern from project's ratings.ts + Next.js revalidatePath docs
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function toggleFavorite(cafeId: string): Promise<{
  success: boolean;
  isFavorited?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('cafe_id', cafeId)
      .single();

    if (existing) {
      // Remove favorite
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('cafe_id', cafeId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Revalidate all affected paths
      revalidatePath('/profile/favorites');
      revalidatePath('/cafes');

      const { data: cafe } = await supabase
        .from('cafes')
        .select('slug')
        .eq('id', cafeId)
        .single();
      if (cafe?.slug) {
        revalidatePath(`/cafes/${cafe.slug}`);
      }

      return { success: true, isFavorited: false };
    } else {
      // Add favorite
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          cafe_id: cafeId,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Revalidate all affected paths
      revalidatePath('/profile/favorites');
      revalidatePath('/cafes');

      const { data: cafe } = await supabase
        .from('cafes')
        .select('slug')
        .eq('id', cafeId)
        .single();
      if (cafe?.slug) {
        revalidatePath(`/cafes/${cafe.slug}`);
      }

      return { success: true, isFavorited: true };
    }
  } catch (err) {
    console.error('Unexpected error toggling favorite:', err);
    return { success: false, error: 'Failed to update favorite' };
  }
}
```

### Complete Client Component with Optimistic UI
```typescript
// Source: React useOptimistic docs + project patterns
'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { toggleFavorite } from '@/lib/actions/favorites';

interface FavoriteButtonProps {
  cafeId: string;
  initialIsFavorited: boolean;
  showLabel?: boolean;
}

export function FavoriteButton({
  cafeId,
  initialIsFavorited,
  showLabel = false
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [optimisticIsFavorited, setOptimisticIsFavorited] = useOptimistic(isFavorited);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if inside Link
    e.stopPropagation();

    startTransition(async () => {
      // Optimistic update
      setOptimisticIsFavorited(!optimisticIsFavorited);

      try {
        const result = await toggleFavorite(cafeId);

        if (result.success && result.isFavorited !== undefined) {
          setIsFavorited(result.isFavorited);
        } else {
          throw new Error(result.error || 'Failed to update favorite');
        }
      } catch (error) {
        // Auto-rollback already happened via useOptimistic
        toast.error('Failed to update favorite');
      }
    });
  };

  return (
    <motion.button
      onClick={handleToggle}
      disabled={isPending}
      className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-accent disabled:opacity-50"
      whileTap={{ scale: 0.9 }}
      animate={{
        scale: optimisticIsFavorited && !initialIsFavorited ? [1, 1.2, 1] : 1
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 15,
      }}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-colors',
          optimisticIsFavorited
            ? 'fill-red-500 text-red-500'
            : 'text-muted-foreground'
        )}
      />
      {showLabel && (
        <span className="text-sm">
          {optimisticIsFavorited ? 'Favorited' : 'Favorite'}
        </span>
      )}
    </motion.button>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Query mutations + onMutate | useOptimistic hook | React 19 (2024) | Simpler API, auto-rollback, less boilerplate |
| Custom debounce with setTimeout | useTransition batching | React 18 (2022) | Built-in transition management, isPending state |
| API Routes for mutations | Server Actions | Next.js 13+ (2023) | Direct function calls, form integration |
| Manual cache invalidation | revalidatePath | Next.js 13+ (2023) | Automatic route cache invalidation |

**Deprecated/outdated:**
- **SWR mutate + optimisticData**: Still works but `useOptimistic` is more idiomatic for React 19
- **useMutation from React Query**: Not needed for simple optimistic updates; built-in hooks sufficient
- **Custom race condition handling**: `useTransition` provides natural debouncing for most cases

## Open Questions

Things that couldn't be fully resolved:

1. **Cross-tab synchronization**
   - What we know: Context decisions left this to Claude's discretion
   - What's unclear: Complexity vs benefit tradeoff for real-time sync across browser tabs
   - Recommendation: Start without cross-tab sync. If needed later, use Supabase Realtime subscriptions to listen for `user_favorites` changes. Most users don't need this.

2. **Favorites filter placement on map**
   - What we know: Context decisions left placement to Claude's discretion (filter bar vs floating button)
   - What's unclear: Whether map page has existing filter UI or needs new component
   - Recommendation: Check existing map implementation. If filter bar exists, add toggle there. Otherwise, use floating button pattern.

3. **Rate limiting implementation**
   - What we know: Context decisions suggest light debouncing, but exact approach up to Claude
   - What's unclear: Whether server-side rate limiting is needed or if `useTransition` batching is sufficient
   - Recommendation: Start with `useTransition` + disabled button (prevents UI spam). Add server-side limit only if abuse detected.

## Sources

### Primary (HIGH confidence)
- [React useOptimistic Documentation](https://react.dev/reference/react/useOptimistic) - Official React 19 hook docs
- [Next.js revalidatePath API](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) - Official Next.js cache invalidation
- [Supabase JavaScript Upsert](https://supabase.com/docs/reference/javascript/upsert) - Official Supabase upsert API
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - Official RLS patterns

### Secondary (MEDIUM confidence)
- [Supercharge Your UX with Optimistic Updates in Next.js 15](https://javascript.plainenglish.io/supercharge-your-ux-with-optimistic-updates-in-next-js-15-56541a19c305) - Next.js 15 optimistic patterns
- [Implementing Optimistic Updates in Next.js for Smooth User Experience](https://jb.desishub.com/blog/implementing-optimistic-update) - Implementation guide
- [Advanced animation patterns with Framer Motion](https://blog.maximeheckel.com/posts/advanced-animation-patterns-with-framer-motion/) - Framer Motion bounce patterns
- [Concurrent Optimistic Updates in React Query](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query) - Race condition handling

### Tertiary (LOW confidence)
- [useOptimistic Won't Save You](https://www.columkelly.com/blog/use-optimistic) - Critical analysis of useOptimistic limitations (verify race condition handling)
- [Debouncing and Throttling in JavaScript](https://www.telerik.com/blogs/debouncing-and-throttling-in-javascript) - General debounce concepts (verify if needed with useTransition)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, official docs verified
- Architecture: HIGH - Patterns verified from official React/Next.js docs and existing project patterns
- Pitfalls: MEDIUM - Race conditions documented but require real-world testing to confirm severity

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable patterns in mature frameworks)
