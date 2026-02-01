import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  UserFavorite,
  FavoriteWithCafe,
  ToggleFavoriteResult,
} from '@/types/favorites';
import { getStorageUrl } from './transforms';

// ============================================
// TOGGLE FAVORITE
// ============================================

/**
 * Toggle favorite status for a cafe
 * If favorited, removes it. If not favorited, adds it.
 * Uses check-then-act pattern since RLS prevents upsert with delete
 * @returns Result with success status and new favorited state
 */
export async function toggleFavorite(
  supabase: SupabaseClient,
  userId: string,
  cafeId: string
): Promise<ToggleFavoriteResult> {
  try {
    // Check if favorite exists
    const { data: existing, error: checkError } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('cafe_id', cafeId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking favorite:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existing) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('cafe_id', cafeId);

      if (deleteError) {
        console.error('Error removing favorite:', deleteError);
        return { success: false, error: deleteError.message };
      }

      return { success: true, isFavorited: false };
    } else {
      // Add favorite
      const { error: insertError } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          cafe_id: cafeId,
        });

      if (insertError) {
        console.error('Error adding favorite:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, isFavorited: true };
    }
  } catch (err) {
    console.error('Unexpected error toggling favorite:', err);
    return { success: false, error: 'Failed to update favorite' };
  }
}

// ============================================
// GET USER FAVORITES
// ============================================

/**
 * Get all favorites for a user with cafe data
 * Includes cafe info with primary image for display
 * @returns Array of favorites with cafe data, ordered by most recent first
 */
export async function getUserFavorites(
  supabase: SupabaseClient,
  userId: string
): Promise<FavoriteWithCafe[]> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        id,
        cafe_id,
        created_at,
        cafe:cafes!inner(
          id,
          name,
          slug,
          address,
          district_id,
          overall_rating,
          total_ratings,
          cafe_images(storage_path)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user favorites:', error);
      return [];
    }

    // Transform to FavoriteWithCafe[]
    return data.map((row) => {
      // Cast through unknown to handle Supabase's type inference for joins
      const cafe = row.cafe as unknown as Record<string, unknown>;
      const cafeImages = cafe.cafe_images as Array<{ storage_path: string }> | null;
      const primaryImage = cafeImages?.[0]?.storage_path || null;

      return {
        id: row.id as string,
        cafeId: row.cafe_id as string,
        createdAt: row.created_at as string,
        cafe: {
          id: cafe.id as string,
          name: (cafe.name || {}) as Record<string, string>,
          slug: cafe.slug as string,
          address: (cafe.address || {}) as Record<string, string>,
          districtId: cafe.district_id as string,
          overallRating: cafe.overall_rating ? parseFloat(cafe.overall_rating as string) : null,
          totalRatings: (cafe.total_ratings as number) || 0,
          primaryImageUrl: getStorageUrl(primaryImage),
        },
      };
    });
  } catch (err) {
    console.error('Unexpected error fetching favorites:', err);
    return [];
  }
}

// ============================================
// CHECK IF CAFE IS FAVORITED
// ============================================

/**
 * Quick check if a specific cafe is favorited by user
 * @returns Boolean indicating if cafe is favorited
 */
export async function isCafeFavorited(
  supabase: SupabaseClient,
  userId: string,
  cafeId: string
): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('cafe_id', cafeId);

    if (error) {
      console.error('Error checking if cafe is favorited:', error);
      return false;
    }

    return (count || 0) > 0;
  } catch (err) {
    console.error('Unexpected error checking favorite status:', err);
    return false;
  }
}

// ============================================
// GET USER FAVORITE IDS
// ============================================

/**
 * Get array of cafe IDs that user has favorited
 * Used for efficient batch checking in cafe lists
 * @returns Array of cafe IDs
 */
export async function getUserFavoriteIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('cafe_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user favorite IDs:', error);
      return [];
    }

    return data.map((row) => row.cafe_id);
  } catch (err) {
    console.error('Unexpected error fetching favorite IDs:', err);
    return [];
  }
}

// ============================================
// GET FAVORITE COUNT FOR CAFE
// ============================================

/**
 * Get total number of users who have favorited a cafe
 * Could be used for displaying popularity
 * @returns Count of favorites for the cafe
 */
export async function getCafeFavoriteCount(
  supabase: SupabaseClient,
  cafeId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('cafe_id', cafeId);

    if (error) {
      console.error('Error fetching cafe favorite count:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Unexpected error fetching favorite count:', err);
    return 0;
  }
}
