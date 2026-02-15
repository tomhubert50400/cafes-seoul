'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ratingFormSchema } from '@/lib/validations/ratings';
import {
  upsertRating,
  getRatingByUserAndCafe,
  getUserRatings,
  getUserRatingsWithImages,
  getCafeRatings,
  getCafeRatingsCount,
  deleteRating,
  updateCafeAverages,
} from '@/lib/supabase/ratings';
import type { RatingFormData } from '@/lib/validations/ratings';
import type { UserRating, UserRatingWithImage } from '@/types/ratings';

// ============================================
// SUBMIT RATING
// ============================================

/**
 * Submit or update a rating for a cafe
 * Upsert operation handles both create and update (RATE-05)
 * Automatically updates cafe averages after submission
 * No rate limiting enforced (RATE-08 - unlimited ratings)
 * @returns Success status with rating data or error
 */
export async function submitRating(data: RatingFormData): Promise<{
  success: boolean;
  rating?: UserRating;
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

    // 2. Validate input with Zod
    const validation = ratingFormSchema.safeParse(data);
    if (!validation.success) {
      const issues = validation.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: `Validation failed: ${issues}` };
    }

    const validatedData = validation.data;

    // 3. Upsert rating (handles both create and update)
    const result = await upsertRating(supabase, user.id, {
      cafeId: validatedData.cafeId,
      overall: validatedData.overall,
      drinks: validatedData.drinks,
      service: validatedData.service,
      priceValue: validatedData.priceValue,
      quietness: validatedData.quietness,
      seating: validatedData.seating,
      comfort: validatedData.comfort,
      food: validatedData.food,
      hasWifi: validatedData.hasWifi,
      hasPowerOutlets: validatedData.hasPowerOutlets,
      isLaptopFriendly: validatedData.isLaptopFriendly,
      petFriendly: validatedData.petFriendly,
      hasParking: validatedData.hasParking,
      lighting: validatedData.lighting,
      outlets: validatedData.outlets,
      reviewText: validatedData.reviewText,
    });

    if ('error' in result) {
      return { success: false, error: result.error };
    }

    // 4. Update cafe averages
    const avgResult = await updateCafeAverages(supabase, validatedData.cafeId);
    if (!avgResult.success) {
      console.warn('Rating saved but cafe averages update failed:', avgResult.error);
      // Continue - rating is saved, just log warning
    }

    // 5. Revalidate paths
    // Need to get cafe slug for revalidation
    const { data: cafe } = await supabase
      .from('cafes')
      .select('slug')
      .eq('id', validatedData.cafeId)
      .single();

    if (cafe?.slug) {
      revalidatePath(`/cafes/${cafe.slug}`);
    }
    revalidatePath('/cafes');
    revalidatePath('/profile/ratings');

    return { success: true, rating: result };
  } catch (err) {
    console.error('Unexpected error submitting rating:', err);
    return { success: false, error: 'Failed to submit rating' };
  }
}

// ============================================
// GET MY RATING FOR CAFE
// ============================================

/**
 * Get current user's rating for a specific cafe
 * Returns null if user hasn't rated this cafe yet
 * @returns Success status with rating or null
 */
export async function getMyRatingForCafe(cafeId: string): Promise<{
  success: boolean;
  rating?: UserRating | null;
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

    // 2. Get rating for user + cafe combo
    const rating = await getRatingByUserAndCafe(supabase, user.id, cafeId);

    return { success: true, rating };
  } catch (err) {
    console.error('Unexpected error fetching rating:', err);
    return { success: false, error: 'Failed to fetch rating' };
  }
}

// ============================================
// GET MY RATINGS
// ============================================

/**
 * Get all ratings by current user
 * Includes joined cafe information
 * @returns Success status with ratings array
 */
export async function getMyRatings(options?: { limit?: number; offset?: number }): Promise<{
  success: boolean;
  ratings?: UserRating[];
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

    // 2. Get user's ratings
    const ratings = await getUserRatings(supabase, user.id, options);

    return { success: true, ratings };
  } catch (err) {
    console.error('Unexpected error fetching ratings:', err);
    return { success: false, error: 'Failed to fetch ratings' };
  }
}

// ============================================
// GET MY RATINGS WITH IMAGES
// ============================================

/**
 * Get all ratings by current user with cafe images
 * Used for My Reviews page where thumbnails are needed
 * Includes joined cafe information with primary image
 * @returns Success status with ratings array including images
 */
export async function getMyRatingsWithImages(): Promise<{
  success: boolean;
  ratings?: UserRatingWithImage[];
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

    // 2. Get user's ratings with cafe images
    const ratings = await getUserRatingsWithImages(supabase, user.id);

    return { success: true, ratings };
  } catch (err) {
    console.error('Unexpected error fetching ratings with images:', err);
    return { success: false, error: 'Failed to fetch ratings' };
  }
}

// ============================================
// GET CAFE RATINGS LIST
// ============================================

/**
 * Get all ratings for a specific cafe
 * Used for cafe detail page to display all user ratings
 * Includes joined user information
 * @returns Success status with ratings array and total count
 */
export async function getCafeRatingsList(
  cafeId: string,
  options?: { limit?: number; offset?: number }
): Promise<{
  success: boolean;
  ratings?: UserRating[];
  total?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get ratings and total count in parallel
    const [ratings, total] = await Promise.all([
      getCafeRatings(supabase, cafeId, options),
      getCafeRatingsCount(supabase, cafeId),
    ]);

    return { success: true, ratings, total };
  } catch (err) {
    console.error('Unexpected error fetching cafe ratings:', err);
    return { success: false, error: 'Failed to fetch ratings' };
  }
}

// ============================================
// DELETE MY RATING
// ============================================

/**
 * Delete user's rating
 * Verifies ownership before deletion
 * Updates cafe averages after deletion
 * @returns Success status or error
 */
export async function deleteMyRating(ratingId: string): Promise<{
  success: boolean;
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

    // 2. Get the rating first to find cafe_id for revalidation
    const { data: rating, error: fetchError } = await supabase
      .from('cafe_ratings')
      .select('cafe_id')
      .eq('id', ratingId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !rating) {
      return { success: false, error: 'Rating not found or not authorized' };
    }

    const cafeId = rating.cafe_id;

    // 3. Delete rating
    const result = await deleteRating(supabase, ratingId, user.id);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // 4. Update cafe averages
    await updateCafeAverages(supabase, cafeId);

    // 5. Revalidate paths
    const { data: cafe } = await supabase
      .from('cafes')
      .select('slug')
      .eq('id', cafeId)
      .single();

    if (cafe?.slug) {
      revalidatePath(`/cafes/${cafe.slug}`);
    }
    revalidatePath('/cafes');
    revalidatePath('/profile/ratings');

    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting rating:', err);
    return { success: false, error: 'Failed to delete rating' };
  }
}

// ============================================
// CHECK IF USER HAS RATED CAFE
// ============================================

/**
 * Quick check if user has already rated a cafe
 * Returns true/false without full rating data
 * Useful for conditional UI (show "Edit Rating" vs "Rate This Cafe")
 * @returns Success status with boolean
 */
export async function hasRatedCafe(cafeId: string): Promise<{
  success: boolean;
  hasRated?: boolean;
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

    // 2. Check if rating exists
    const { count, error } = await supabase
      .from('cafe_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('cafe_id', cafeId);

    if (error) {
      console.error('Error checking if user has rated:', error);
      return { success: false, error: error.message };
    }

    return { success: true, hasRated: (count || 0) > 0 };
  } catch (err) {
    console.error('Unexpected error checking rating status:', err);
    return { success: false, error: 'Failed to check rating status' };
  }
}
