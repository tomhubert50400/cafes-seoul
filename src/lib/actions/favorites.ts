'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  toggleFavorite,
  getUserFavorites,
  isCafeFavorited,
  getUserFavoriteIds,
} from '@/lib/supabase/favorites';
import type { FavoriteWithCafe, ToggleFavoriteResult } from '@/types/favorites';

// ============================================
// TOGGLE FAVORITE ACTION
// ============================================

/**
 * Toggle favorite status for a cafe
 * Adds if not favorited, removes if already favorited
 * Revalidates all affected paths
 * @returns Success status with new favorited state
 */
export async function toggleFavoriteAction(
  cafeId: string
): Promise<ToggleFavoriteResult> {
  try {
    // 1. Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Toggle favorite
    const result = await toggleFavorite(supabase, user.id, cafeId);

    if (!result.success) {
      return result;
    }

    // 3. Revalidate paths
    revalidatePath('/profile/favorites');
    revalidatePath('/cafes');
    revalidatePath('/map');

    // Get cafe slug for specific page revalidation
    const { data: cafe } = await supabase
      .from('cafes')
      .select('slug')
      .eq('id', cafeId)
      .single();

    if (cafe?.slug) {
      revalidatePath(`/cafes/${cafe.slug}`);
    }

    return result;
  } catch (err) {
    console.error('Unexpected error toggling favorite:', err);
    return { success: false, error: 'Failed to update favorite' };
  }
}

// ============================================
// GET FAVORITES ACTION
// ============================================

/**
 * Get all favorites for current user
 * Includes full cafe data with images
 * @returns Success status with favorites array
 */
export async function getFavoritesAction(): Promise<{
  success: boolean;
  favorites?: FavoriteWithCafe[];
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

    // 2. Get favorites
    const favorites = await getUserFavorites(supabase, user.id);

    return { success: true, favorites };
  } catch (err) {
    console.error('Unexpected error fetching favorites:', err);
    return { success: false, error: 'Failed to fetch favorites' };
  }
}

// ============================================
// CHECK FAVORITE ACTION
// ============================================

/**
 * Check if a specific cafe is favorited by current user
 * @returns Success status with boolean
 */
export async function checkFavoriteAction(cafeId: string): Promise<{
  success: boolean;
  isFavorited?: boolean;
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

    // 2. Check if favorited
    const isFavorited = await isCafeFavorited(supabase, user.id, cafeId);

    return { success: true, isFavorited };
  } catch (err) {
    console.error('Unexpected error checking favorite:', err);
    return { success: false, error: 'Failed to check favorite status' };
  }
}

// ============================================
// GET FAVORITE IDS ACTION
// ============================================

/**
 * Get array of cafe IDs that current user has favorited
 * Used for efficient batch checking in cafe lists
 * @returns Success status with array of cafe IDs
 */
export async function getFavoriteIdsAction(): Promise<{
  success: boolean;
  cafeIds?: string[];
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

    // 2. Get favorite IDs
    const cafeIds = await getUserFavoriteIds(supabase, user.id);

    return { success: true, cafeIds };
  } catch (err) {
    console.error('Unexpected error fetching favorite IDs:', err);
    return { success: false, error: 'Failed to fetch favorite IDs' };
  }
}
