'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { reviewTextSchema } from '@/lib/validations/reviews';
import {
  updateReviewText,
  deleteHelpfulVotesForRating,
  toggleHelpfulVote,
  getCafeReviewsWithVotes,
  getRatingById,
  adminDeleteReviewText,
} from '@/lib/supabase/reviews';
import type {
  UpdateReviewTextResult,
  ToggleHelpfulResult,
  ReviewWithAuthor,
} from '@/types/reviews';

// ============================================
// UPDATE REVIEW TEXT ACTION
// ============================================

/**
 * Update review text for a rating
 * Validates input, updates text, and cleans up votes if text deleted
 * @returns Success/error result
 */
export async function updateReviewTextAction(
  ratingId: string,
  reviewText: string
): Promise<UpdateReviewTextResult> {
  try {
    // 1. Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Validate with Zod
    const validation = reviewTextSchema.safeParse({ reviewText });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    // 3. Convert empty string to null for database
    const textToSave = reviewText.trim() || null;

    // 4. Update review text (ownership checked in query via user_id match)
    const result = await updateReviewText(supabase, ratingId, user.id, textToSave);

    if (!result.success) {
      return result;
    }

    // 5. If deleting text, remove all helpful votes for this rating
    if (!textToSave) {
      await deleteHelpfulVotesForRating(supabase, ratingId);
    }

    // 6. Revalidate paths
    revalidatePath('/profile/reviews');

    // Get cafe info for specific page revalidation
    const rating = await getRatingById(supabase, ratingId);
    if (rating) {
      const { data: cafe } = await supabase
        .from('cafes')
        .select('slug')
        .eq('id', rating.cafeId)
        .single();

      if (cafe?.slug) {
        revalidatePath(`/cafes/${cafe.slug}`);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error updating review text:', err);
    return { success: false, error: 'Failed to update review' };
  }
}

// ============================================
// DELETE REVIEW TEXT ACTION
// ============================================

/**
 * Delete review text (set to null)
 * Convenience wrapper around updateReviewTextAction
 * Confirmation dialog is handled in UI
 * @returns Success/error result
 */
export async function deleteReviewTextAction(
  ratingId: string
): Promise<UpdateReviewTextResult> {
  return updateReviewTextAction(ratingId, '');
}

// ============================================
// TOGGLE HELPFUL ACTION
// ============================================

/**
 * Toggle helpful vote for a review
 * Prevents voting on own reviews and rating-only entries
 * @returns Success/error result with current vote state
 */
export async function toggleHelpfulAction(
  ratingId: string
): Promise<ToggleHelpfulResult> {
  try {
    // 1. Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Get rating info for ownership and text check
    const rating = await getRatingById(supabase, ratingId);

    if (!rating) {
      return { success: false, error: 'Review not found' };
    }

    // 3. Check if voting on own review
    if (rating.userId === user.id) {
      return { success: false, error: 'Cannot vote on own review' };
    }

    // 4. Check if review has text (no voting on rating-only entries)
    if (!rating.reviewText) {
      return { success: false, error: 'Review has no text' };
    }

    // 5. Toggle the vote
    const result = await toggleHelpfulVote(supabase, user.id, ratingId);

    if (!result.success) {
      return result;
    }

    // 6. Revalidate cafe page
    const { data: cafe } = await supabase
      .from('cafes')
      .select('slug')
      .eq('id', rating.cafeId)
      .single();

    if (cafe?.slug) {
      revalidatePath(`/cafes/${cafe.slug}`);
    }

    return result;
  } catch (err) {
    console.error('Unexpected error toggling helpful vote:', err);
    return { success: false, error: 'Failed to update vote' };
  }
}

// ============================================
// GET CAFE REVIEWS ACTION
// ============================================

/**
 * Get all reviews for a cafe with author and vote info
 * Works for both logged-in and anonymous users
 * @returns Success/error result with reviews array
 */
export async function getCafeReviewsAction(
  cafeId: string
): Promise<{
  success: boolean;
  reviews?: ReviewWithAuthor[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user ID (may be null for non-logged-in)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const currentUserId = user?.id || null;

    // Fetch reviews with votes
    const reviews = await getCafeReviewsWithVotes(supabase, cafeId, currentUserId);

    return { success: true, reviews };
  } catch (err) {
    console.error('Unexpected error fetching cafe reviews:', err);
    return { success: false, error: 'Failed to fetch reviews' };
  }
}
