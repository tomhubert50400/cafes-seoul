'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ToggleVoteResult } from '@/types/photos';

// ============================================
// TOGGLE VOTE
// ============================================

/**
 * Toggle vote on a photo
 * If user has voted: removes vote (toggle off)
 * If user hasn't voted: adds vote (toggle on)
 * Returns updated vote count and user's vote status
 * @param photoId - The photo ID to vote on
 * @returns ToggleVoteResult with success status and updated counts
 */
export async function toggleVote(photoId: string): Promise<ToggleVoteResult> {
  try {
    // 1. Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        upvoteCount: 0,
        hasVoted: false,
        error: 'Authentication required',
      };
    }

    // 2. Check if user already voted for this photo
    const { data: existingVote, error: checkError } = await supabase
      .from('photo_votes')
      .select('id')
      .eq('user_id', user.id)
      .eq('photo_id', photoId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing vote:', checkError);
      return {
        success: false,
        upvoteCount: 0,
        hasVoted: false,
        error: 'Failed to check vote status',
      };
    }

    // 3. Toggle vote (delete if exists, insert if not)
    if (existingVote) {
      // User already voted - delete the vote (toggle off)
      const { error: deleteError } = await supabase
        .from('photo_votes')
        .delete()
        .eq('id', existingVote.id);

      if (deleteError) {
        console.error('Error removing vote:', deleteError);
        return {
          success: false,
          upvoteCount: 0,
          hasVoted: true,
          error: 'Failed to remove vote',
        };
      }
    } else {
      // User hasn't voted - insert new vote (toggle on)
      const { error: insertError } = await supabase
        .from('photo_votes')
        .insert({
          user_id: user.id,
          photo_id: photoId,
        });

      if (insertError) {
        console.error('Error adding vote:', insertError);
        return {
          success: false,
          upvoteCount: 0,
          hasVoted: false,
          error: 'Failed to add vote',
        };
      }
    }

    // 4. Get updated upvote count from photos table (trigger updates this)
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('upvote_count, cafe_id')
      .eq('id', photoId)
      .single();

    if (photoError) {
      console.error('Error fetching updated photo:', photoError);
      return {
        success: false,
        upvoteCount: 0,
        hasVoted: !existingVote, // Revert optimistic expectation
        error: 'Failed to get updated count',
      };
    }

    // 5. Revalidate cafe detail page to reflect new vote counts
    // Need to get cafe slug for revalidation
    const { data: cafe } = await supabase
      .from('cafes')
      .select('slug')
      .eq('id', photo.cafe_id)
      .single();

    if (cafe?.slug) {
      revalidatePath(`/cafes/${cafe.slug}`);
    }

    return {
      success: true,
      upvoteCount: photo.upvote_count,
      hasVoted: !existingVote, // If we deleted, now false; if we inserted, now true
    };
  } catch (err) {
    console.error('Unexpected error toggling vote:', err);
    return {
      success: false,
      upvoteCount: 0,
      hasVoted: false,
      error: 'Failed to toggle vote',
    };
  }
}

// ============================================
// GET USER'S VOTE STATUS
// ============================================

/**
 * Check if current user has voted for a specific photo
 * @param photoId - The photo ID to check
 * @returns Object with hasVoted boolean
 */
export async function getUserVoteStatus(photoId: string): Promise<{
  success: boolean;
  hasVoted?: boolean;
  error?: string;
}> {
  try {
    // 1. Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Check for existing vote
    const { count, error } = await supabase
      .from('photo_votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('photo_id', photoId);

    if (error) {
      console.error('Error checking vote status:', error);
      return { success: false, error: 'Failed to check vote status' };
    }

    return { success: true, hasVoted: (count || 0) > 0 };
  } catch (err) {
    console.error('Unexpected error checking vote status:', err);
    return { success: false, error: 'Failed to check vote status' };
  }
}

// ============================================
// GET PHOTOS FOR CAFE
// ============================================

/**
 * Fetch photos for a cafe with current user's vote status
 * Photos sorted by upvote_count DESC, then created_at DESC
 * Only shows approved photos to public, but shows user's own photos regardless of status
 * @param cafeId - The cafe ID
 * @param limit - Maximum number of photos to fetch (default 50)
 * @param offset - Offset for pagination (default 0)
 * @returns Array of photos with vote status
 */
export async function getCafePhotos(
  cafeId: string,
  options?: { limit?: number; offset?: number }
): Promise<{
  success: boolean;
  photos?: Array<{
    id: string;
    url: string;
    upvoteCount: number;
    hasVoted: boolean;
    status: 'pending' | 'approved' | 'rejected';
    isOwnPhoto: boolean;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    // Build query for photos
    // Public sees: approved photos
    // Logged in user sees: approved photos + their own photos (any status)
    let query = supabase
      .from('photos')
      .select('*')
      .eq('cafe_id', cafeId)
      .order('upvote_count', { ascending: false })
      .order('created_at', { ascending: false });

    // If user is logged in, we need to fetch all their photos plus approved photos
    // We'll filter in the application layer for simplicity
    const { data: photos, error: photosError } = await query.range(offset, offset + limit - 1);

    if (photosError) {
      console.error('Error fetching photos:', photosError);
      return { success: false, error: 'Failed to fetch photos' };
    }

    if (!photos || photos.length === 0) {
      return { success: true, photos: [] };
    }

    // Get user's votes for these photos if logged in
    const photoIds = photos.map((p) => p.id);
    let userVotes: Set<string> = new Set();

    if (user) {
      const { data: votes, error: votesError } = await supabase
        .from('photo_votes')
        .select('photo_id')
        .eq('user_id', user.id)
        .in('photo_id', photoIds);

      if (!votesError && votes) {
        userVotes = new Set(votes.map((v) => v.photo_id));
      }
    }

    // Transform to PhotoWithVoteStatus
    const transformedPhotos = photos
      .filter((photo) => {
        // Public: only approved photos
        // Owner: all their own photos + approved photos from others
        if (photo.status === 'approved') return true;
        if (user && photo.user_id === user.id) return true;
        return false;
      })
      .map((photo) => ({
        id: photo.id,
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cafe-images/${photo.storage_path}`,
        upvoteCount: photo.upvote_count,
        hasVoted: userVotes.has(photo.id),
        status: photo.status as 'pending' | 'approved' | 'rejected',
        isOwnPhoto: user ? photo.user_id === user.id : false,
      }));

    return { success: true, photos: transformedPhotos };
  } catch (err) {
    console.error('Unexpected error fetching photos:', err);
    return { success: false, error: 'Failed to fetch photos' };
  }
}
