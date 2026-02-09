import type { SupabaseClient } from '@supabase/supabase-js';
import { transformCafeSummary, getStorageUrl } from './transforms';
import type { CafeSummary } from '@/types/cafe';
import type { ForYouCafe } from '@/types/for-you';

interface RecommendationRow {
  cafe_id: string;
  similarity_score: number;
}

export async function getRecommendations(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 6
): Promise<CafeSummary[]> {
  // Get recommended cafe IDs from the RPC
  const { data: recommendations, error: rpcError } = await supabase
    .rpc('get_recommendations', { p_user_id: userId, p_limit: limit });

  if (rpcError || !recommendations || recommendations.length === 0) {
    return [];
  }

  const cafeIds = (recommendations as RecommendationRow[]).map((r) => r.cafe_id);

  // Fetch full cafe data for the recommended IDs
  const { data: cafes, error: cafesError } = await supabase
    .from('cafes')
    .select(`
      id, name, slug, address, district_id,
      latitude, longitude,
      overall_rating, total_ratings,
      rating_food, rating_drinks, rating_temperature, rating_seating,
      rating_ambiance, rating_wifi, rating_noise, rating_outlets, rating_value,
      price_range, cafe_type,
      has_wifi, has_power_outlets, is_pet_friendly, is_laptop_friendly, has_parking,
      photos(storage_path, upvote_count, status)
    `)
    .in('id', cafeIds)
    .eq('status', 'active');

  if (cafesError || !cafes) {
    return [];
  }

  // Transform and maintain recommendation order
  const cafeMap = new Map<string, CafeSummary>();
  for (const row of cafes) {
    const photos = row.photos as { storage_path: string; upvote_count: number; status: string }[] | null;
    const topPhoto = photos
      ?.filter((p) => p.status === 'approved')
      .sort((a, b) => b.upvote_count - a.upvote_count)[0];
    cafeMap.set(row.id, transformCafeSummary({
      ...row,
      primary_image_url: topPhoto?.storage_path || null,
    }));
  }

  // Return in recommendation order
  return cafeIds
    .map((id) => cafeMap.get(id))
    .filter((c): c is CafeSummary => c != null);
}
