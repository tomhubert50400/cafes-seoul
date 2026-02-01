import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ReviewWithAuthor,
  ReviewAuthor,
  ToggleHelpfulResult,
  UpdateReviewTextResult,
} from '@/types/reviews';

// ============================================
// UPDATE REVIEW TEXT
// ============================================

/**
 * Update review text for a rating
 * User ownership verified via user_id match in WHERE clause
 * Set reviewText to null for deletion
 * @returns Success/error result
 */
export async function updateReviewText(
  supabase: SupabaseClient,
  ratingId: string,
  userId: string,
  reviewText: string | null
): Promise<UpdateReviewTextResult> {
  try {
    const { error } = await supabase
      .from('cafe_ratings')
      .update({
        review_text: reviewText,
      })
      .eq('id', ratingId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating review text:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error updating review text:', err);
    return { success: false, error: 'Failed to update review text' };
  }
}

// ============================================
// DELETE HELPFUL VOTES FOR RATING
// ============================================

/**
 * Delete all helpful votes for a rating
 * Called when review text is deleted to clean up orphaned votes
 * @returns void (fire and forget, errors logged)
 */
export async function deleteHelpfulVotesForRating(
  supabase: SupabaseClient,
  ratingId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('review_helpful_votes')
      .delete()
      .eq('rating_id', ratingId);

    if (error) {
      console.error('Error deleting helpful votes for rating:', error);
    }
  } catch (err) {
    console.error('Unexpected error deleting helpful votes:', err);
  }
}

// ============================================
// TOGGLE HELPFUL VOTE
// ============================================

/**
 * Toggle helpful vote for a review
 * Uses check-then-act pattern (follows favorites pattern)
 * If voted, removes it. If not voted, adds it.
 * @returns Result with success status and new voted state
 */
export async function toggleHelpfulVote(
  supabase: SupabaseClient,
  userId: string,
  ratingId: string
): Promise<ToggleHelpfulResult> {
  try {
    // Check if vote exists
    const { data: existing, error: checkError } = await supabase
      .from('review_helpful_votes')
      .select('id')
      .eq('user_id', userId)
      .eq('rating_id', ratingId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking helpful vote:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existing) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from('review_helpful_votes')
        .delete()
        .eq('user_id', userId)
        .eq('rating_id', ratingId);

      if (deleteError) {
        console.error('Error removing helpful vote:', deleteError);
        return { success: false, error: deleteError.message };
      }

      return { success: true, isVoted: false };
    } else {
      // Add vote
      const { error: insertError } = await supabase
        .from('review_helpful_votes')
        .insert({
          user_id: userId,
          rating_id: ratingId,
        });

      if (insertError) {
        console.error('Error adding helpful vote:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, isVoted: true };
    }
  } catch (err) {
    console.error('Unexpected error toggling helpful vote:', err);
    return { success: false, error: 'Failed to update vote' };
  }
}

// ============================================
// GET CAFE REVIEWS WITH VOTES
// ============================================

/**
 * Get all reviews with text for a cafe
 * Includes author info, helpful count, and vote status
 * Orders by newest first
 * @returns Array of reviews with author and vote info
 */
export async function getCafeReviewsWithVotes(
  supabase: SupabaseClient,
  cafeId: string,
  currentUserId: string | null
): Promise<ReviewWithAuthor[]> {
  try {
    // Query ratings that have review text
    const { data: reviews, error } = await supabase
      .from('cafe_ratings')
      .select(`
        id,
        cafe_id,
        user_id,
        overall,
        review_text,
        review_edited_at,
        created_at
      `)
      .eq('cafe_id', cafeId)
      .not('review_text', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cafe reviews:', error);
      return [];
    }

    if (!reviews || reviews.length === 0) {
      return [];
    }

    // Get unique user IDs and rating IDs
    const userIds = [...new Set(reviews.map((r) => r.user_id))];
    const ratingIds = reviews.map((r) => r.id);

    // Fetch author profiles separately (profiles.id = user_id)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, is_private')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching author profiles:', profileError);
    }

    // Create profile lookup map
    const profileMap = new Map<string, {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      is_private: boolean;
    }>();
    profiles?.forEach((p) => profileMap.set(p.id, p));

    // Get vote counts for all ratings
    const { data: voteCounts, error: countError } = await supabase
      .from('review_helpful_votes')
      .select('rating_id')
      .in('rating_id', ratingIds);

    if (countError) {
      console.error('Error fetching vote counts:', countError);
    }

    // Count votes per rating
    const voteCountMap = new Map<string, number>();
    voteCounts?.forEach((vote) => {
      const current = voteCountMap.get(vote.rating_id) || 0;
      voteCountMap.set(vote.rating_id, current + 1);
    });

    // Get user's votes if logged in
    let userVotedIds = new Set<string>();
    if (currentUserId) {
      userVotedIds = await getUserVotedRatingIds(supabase, currentUserId, ratingIds);
    }

    // Transform to ReviewWithAuthor[]
    return reviews.map((row) => {
      const authorData = profileMap.get(row.user_id);

      const author: ReviewAuthor = {
        id: authorData?.id || row.user_id,
        displayName: authorData?.display_name || null,
        avatarUrl: authorData?.avatar_url || null,
        profilePublic: !(authorData?.is_private ?? true), // is_private = false means public
      };

      return {
        id: row.id,
        cafeId: row.cafe_id,
        userId: row.user_id,
        overall: row.overall,
        reviewText: row.review_text,
        reviewEditedAt: row.review_edited_at,
        createdAt: row.created_at,
        author,
        helpfulCount: voteCountMap.get(row.id) || 0,
        userHasVoted: userVotedIds.has(row.id),
        isOwnReview: currentUserId === row.user_id,
      };
    });
  } catch (err) {
    console.error('Unexpected error fetching cafe reviews:', err);
    return [];
  }
}

// ============================================
// GET USER VOTED RATING IDS
// ============================================

/**
 * Get all rating IDs user has voted on from provided list
 * Used for batch checking vote status
 * @returns Set of rating IDs user has voted on
 */
export async function getUserVotedRatingIds(
  supabase: SupabaseClient,
  userId: string,
  ratingIds: string[]
): Promise<Set<string>> {
  try {
    if (ratingIds.length === 0) {
      return new Set();
    }

    const { data, error } = await supabase
      .from('review_helpful_votes')
      .select('rating_id')
      .eq('user_id', userId)
      .in('rating_id', ratingIds);

    if (error) {
      console.error('Error fetching user voted rating IDs:', error);
      return new Set();
    }

    return new Set(data?.map((v) => v.rating_id) || []);
  } catch (err) {
    console.error('Unexpected error fetching user voted IDs:', err);
    return new Set();
  }
}

// ============================================
// GET RATING BY ID
// ============================================

/**
 * Get a rating by its ID (for ownership checks, etc.)
 * @returns Rating data or null if not found
 */
export async function getRatingById(
  supabase: SupabaseClient,
  ratingId: string
): Promise<{
  id: string;
  userId: string;
  cafeId: string;
  reviewText: string | null;
} | null> {
  try {
    const { data, error } = await supabase
      .from('cafe_ratings')
      .select('id, user_id, cafe_id, review_text')
      .eq('id', ratingId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      cafeId: data.cafe_id,
      reviewText: data.review_text,
    };
  } catch (err) {
    console.error('Unexpected error fetching rating by ID:', err);
    return null;
  }
}
