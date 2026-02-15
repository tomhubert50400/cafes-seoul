import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRating, RatingInput, UserRatingWithImage } from '@/types/ratings';
import { transformUserRating, transformRatingCafeWithImage } from './transforms';

// ============================================
// RATING CRUD OPERATIONS
// ============================================

/**
 * Upsert a rating - creates new or updates existing
 * Uses unique(user_id, cafe_id) constraint for conflict resolution
 * @returns Created/updated rating or error object
 */
export async function upsertRating(
  supabase: SupabaseClient,
  userId: string,
  data: RatingInput
): Promise<UserRating | { error: string }> {
  try {
    const { data: result, error } = await supabase
      .from('cafe_ratings')
      .upsert(
        {
          user_id: userId,
          cafe_id: data.cafeId,
          overall: data.overall,
          drinks: data.drinks ?? 0,
          service: data.service ?? 0,
          price_value: data.priceValue ?? 0,
          quietness: data.quietness ?? 0,
          seating: data.seating ?? 0,
          comfort: data.comfort ?? 0,
          food: data.food ?? 0,
          has_wifi: data.hasWifi ?? false,
          has_power_outlets: data.hasPowerOutlets ?? false,
          is_laptop_friendly: data.isLaptopFriendly ?? false,
          pet_friendly: data.petFriendly ?? false,
          has_parking: data.hasParking ?? false,
          lighting: data.lighting ?? 0,
          aesthetic: data.aesthetic ?? 0,
          review_text: data.reviewText || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,cafe_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting rating:', error);
      return { error: error.message };
    }

    return transformUserRating(result);
  } catch (err) {
    console.error('Unexpected error upserting rating:', err);
    return { error: 'Failed to save rating' };
  }
}

/**
 * Get a single rating by user and cafe
 * @returns Rating or null if not found
 */
export async function getRatingByUserAndCafe(
  supabase: SupabaseClient,
  userId: string,
  cafeId: string
): Promise<UserRating | null> {
  try {
    const { data, error } = await supabase
      .from('cafe_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('cafe_id', cafeId)
      .single();

    if (error || !data) {
      return null;
    }

    return transformUserRating(data);
  } catch (err) {
    console.error('Unexpected error fetching rating:', err);
    return null;
  }
}

/**
 * Get all ratings for a user with cafe info
 * @returns Array of ratings with joined cafe data
 */
export async function getUserRatings(
  supabase: SupabaseClient,
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<UserRating[]> {
  try {
    let query = supabase
      .from('cafe_ratings')
      .select(`
        *,
        cafe:cafes!inner(
          id,
          name,
          slug
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user ratings:', error);
      return [];
    }

    return data.map(transformUserRating);
  } catch (err) {
    console.error('Unexpected error fetching user ratings:', err);
    return [];
  }
}

/**
 * Get all ratings for a user with cafe info INCLUDING primary image
 * Used for My Reviews page where thumbnails are needed
 * @returns Array of ratings with joined cafe data and images
 */
export async function getUserRatingsWithImages(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRatingWithImage[]> {
  try {
    const { data, error } = await supabase
      .from('cafe_ratings')
      .select(`
        *,
        cafe:cafes!inner(
          id,
          name,
          slug,
          photos(storage_path, upvote_count, status)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user ratings with images:', error);
      return [];
    }

    return data.map(row => {
      const baseRating = transformUserRating(row);
      return {
        ...baseRating,
        cafe: transformRatingCafeWithImage(row.cafe),
      };
    });
  } catch (err) {
    console.error('Unexpected error fetching user ratings with images:', err);
    return [];
  }
}

/**
 * Get all ratings for a cafe with user info
 * @returns Array of ratings with joined user data
 */
export async function getCafeRatings(
  supabase: SupabaseClient,
  cafeId: string,
  options?: { limit?: number; offset?: number }
): Promise<UserRating[]> {
  try {
    let query = supabase
      .from('cafe_ratings')
      .select(`
        *,
        user:profiles!inner(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('cafe_id', cafeId)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cafe ratings:', error);
      return [];
    }

    return data.map(transformUserRating);
  } catch (err) {
    console.error('Unexpected error fetching cafe ratings:', err);
    return [];
  }
}

/**
 * Get total count of ratings for a cafe
 * @returns Count of ratings
 */
export async function getCafeRatingsCount(
  supabase: SupabaseClient,
  cafeId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('cafe_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('cafe_id', cafeId);

    if (error) {
      console.error('Error fetching cafe ratings count:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Unexpected error fetching cafe ratings count:', err);
    return 0;
  }
}

/**
 * Delete a rating - verifies ownership before delete
 * @returns Success boolean or error object
 */
export async function deleteRating(
  supabase: SupabaseClient,
  ratingId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('cafe_ratings')
      .select('id')
      .eq('id', ratingId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'Rating not found or not authorized' };
    }

    const { error } = await supabase
      .from('cafe_ratings')
      .delete()
      .eq('id', ratingId);

    if (error) {
      console.error('Error deleting rating:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting rating:', err);
    return { success: false, error: 'Failed to delete rating' };
  }
}

// ============================================
// CAFE AVERAGE CALCULATIONS
// ============================================

/**
 * Update cafe aggregate ratings after a rating change
 * Calculates averages excluding 0 values (RATE-04)
 * Updates cafes table with new averages and total count
 * @returns Success boolean or error object
 */
export async function updateCafeAverages(
  supabase: SupabaseClient,
  cafeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use a single RPC call to calculate and update all averages
    // This ensures atomicity and uses the database's optimized calculations
    const { error } = await supabase.rpc('update_cafe_rating_aggregates', {
      p_cafe_id: cafeId,
    });

    if (error) {
      // If RPC doesn't exist, fall back to manual calculation
      console.warn('Rating averages RPC not available, using fallback:', error.message);
      return updateCafeAveragesFallback(supabase, cafeId);
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error updating cafe averages:', err);
    return { success: false, error: 'Failed to update cafe averages' };
  }
}

/**
 * Fallback method for updating cafe averages when RPC is not available
 * Calculates averages manually using NULLIF to exclude 0 values
 */
async function updateCafeAveragesFallback(
  supabase: SupabaseClient,
  cafeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Calculate averages excluding 0 values using NULLIF
    // NULLIF(column, 0) returns NULL if column = 0, otherwise returns column
    // AVG ignores NULL values, so this effectively excludes 0s from the average
    const { data: stats, error: statsError } = await supabase
      .from('cafe_ratings')
      .select(
        `
        overall:avg(overall)::float,
        drinks:avg(nullif(drinks, 0))::float,
        service:avg(nullif(service, 0))::float,
        price_value:avg(nullif(price_value, 0))::float,
        quietness:avg(nullif(quietness, 0))::float,
        seating:avg(nullif(seating, 0))::float,
        comfort:avg(nullif(comfort, 0))::float,
        food:avg(nullif(food, 0))::float,
        lighting:avg(nullif(lighting, 0))::float,
        aesthetic:avg(nullif(aesthetic, 0))::float,
        wifi_pct:avg(case when has_wifi then 1.0 else 0.0 end)::float,
        outlets_pct:avg(case when has_power_outlets then 1.0 else 0.0 end)::float,
        laptop_pct:avg(case when is_laptop_friendly then 1.0 else 0.0 end)::float,
        pet_pct:avg(case when pet_friendly then 1.0 else 0.0 end)::float,
        parking_pct:avg(case when has_parking then 1.0 else 0.0 end)::float,
        count:count(*)::int
      `
      )
      .eq('cafe_id', cafeId)
      .single();

    if (statsError) {
      console.error('Error calculating cafe rating statistics:', statsError);
      return { success: false, error: statsError.message };
    }

    // Cast via unknown to handle Supabase parser limitations with complex SQL
    const statsData = (stats as unknown) as Record<string, unknown> | null;
    const totalCount = (statsData?.count as number) || 0;

    // Update the cafes table with calculated averages
    const { error: updateError } = await supabase
      .from('cafes')
      .update({
        overall_rating: (statsData?.overall as number) || 0,
        total_ratings: totalCount,
        rating_drinks: statsData?.drinks as number | null,
        rating_service: statsData?.service as number | null,
        rating_price_value: statsData?.price_value as number | null,
        rating_quietness: statsData?.quietness as number | null,
        rating_seating: statsData?.seating as number | null,
        rating_comfort: statsData?.comfort as number | null,
        rating_food: statsData?.food as number | null,
        rating_lighting: statsData?.lighting as number | null,
        rating_aesthetic: statsData?.aesthetic as number | null,
        // Aggregate booleans: true if >= 50% of raters said yes
        has_wifi: totalCount > 0 && (statsData?.wifi_pct as number) >= 0.5 ? true : undefined,
        has_power_outlets: totalCount > 0 && (statsData?.outlets_pct as number) >= 0.5 ? true : undefined,
        is_laptop_friendly: totalCount > 0 && (statsData?.laptop_pct as number) >= 0.5 ? true : undefined,
        is_pet_friendly: totalCount > 0 && (statsData?.pet_pct as number) >= 0.5 ? true : undefined,
        has_parking: totalCount > 0 && (statsData?.parking_pct as number) >= 0.5 ? true : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cafeId);

    if (updateError) {
      console.error('Error updating cafe averages:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in fallback cafe averages:', err);
    return { success: false, error: 'Failed to update cafe averages' };
  }
}

/**
 * Get rating statistics for a cafe
 * Returns raw average data without updating the cafes table
 * @returns Statistics object or null on error
 */
export async function getCafeRatingStats(
  supabase: SupabaseClient,
  cafeId: string
): Promise<{
  overall: number;
  drinks: number | null;
  service: number | null;
  priceValue: number | null;
  quietness: number | null;
  seating: number | null;
  comfort: number | null;
  food: number | null;
  lighting: number | null;
  aesthetic: number | null;
  petFriendlyPercent: number | null;
  totalCount: number;
} | null> {
  try {
    const { data, error } = await supabase
      .from('cafe_ratings')
      .select(
        `
        overall:avg(overall)::float,
        drinks:avg(nullif(drinks, 0))::float,
        service:avg(nullif(service, 0))::float,
        price_value:avg(nullif(price_value, 0))::float,
        quietness:avg(nullif(quietness, 0))::float,
        seating:avg(nullif(seating, 0))::float,
        comfort:avg(nullif(comfort, 0))::float,
        food:avg(nullif(food, 0))::float,
        lighting:avg(nullif(lighting, 0))::float,
        aesthetic:avg(nullif(aesthetic, 0))::float,
        pet_friendly_percent:avg(case when pet_friendly then 1.0 else 0.0 end)::float,
        count:count(*)::int
      `
      )
      .eq('cafe_id', cafeId)
      .single();

    if (error || !data) {
      console.error('Error fetching cafe rating stats:', error);
      return null;
    }

    // Cast via unknown to handle Supabase parser limitations with complex SQL
    const statsData = (data as unknown) as Record<string, unknown> | null;

    return {
      overall: (statsData?.overall as number) || 0,
      drinks: (statsData?.drinks as number | null) ?? null,
      wifi: (statsData?.wifi as number | null) ?? null,
      priceValue: (statsData?.price_value as number | null) ?? null,
      quietness: (statsData?.quietness as number | null) ?? null,
      seating: (statsData?.seating as number | null) ?? null,
      comfort: (statsData?.comfort as number | null) ?? null,
      food: (statsData?.food as number | null) ?? null,
      lighting: (statsData?.lighting as number | null) ?? null,
      outlets: (statsData?.outlets as number | null) ?? null,
      petFriendlyPercent: (statsData?.pet_friendly_percent as number | null) ?? null,
      totalCount: (statsData?.count as number) || 0,
    };
  } catch (err) {
    console.error('Unexpected error fetching cafe rating stats:', err);
    return null;
  }
}
