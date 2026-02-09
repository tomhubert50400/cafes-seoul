import type { SupabaseClient } from '@supabase/supabase-js';
import { transformCafeSummary, getStorageUrl } from './transforms';
import type { CafeSummary, RatingBreakdown } from '@/types/cafe';
import type { ForYouCafe } from '@/types/for-you';

export type RatingDimension = keyof RatingBreakdown;

// Maps DB column names to RatingBreakdown keys
const DB_TO_DIMENSION: Record<string, RatingDimension> = {
  coffee: 'drinks',
  wifi: 'wifi',
  price_value: 'priceValue',
  quietness: 'quietness',
  seating: 'seating',
  comfort: 'comfort',
  food: 'food',
  lighting: 'lighting',
  outlets: 'outlets',
};

const DIMENSION_COLUMNS = Object.keys(DB_TO_DIMENSION);

/**
 * Get the user's top N most-rated dimensions (by frequency of non-zero ratings).
 * Returns RatingBreakdown keys ordered by how often the user rates that dimension.
 * Falls back to a default set for anonymous/new users.
 */
export async function getUserTopDimensions(
  supabase: SupabaseClient,
  userId: string | null,
  count: number = 3
): Promise<RatingDimension[]> {
  const DEFAULT_DIMS: RatingDimension[] = ['drinks', 'quietness', 'wifi'];

  if (!userId) return DEFAULT_DIMS;

  const { data: ratings, error } = await supabase
    .from('cafe_ratings')
    .select(DIMENSION_COLUMNS.join(', '))
    .eq('user_id', userId);

  if (error || !ratings || ratings.length === 0) return DEFAULT_DIMS;

  // Count non-zero values per dimension
  const counts: Record<string, number> = {};
  for (const col of DIMENSION_COLUMNS) {
    counts[col] = ratings.filter((r) => (r as Record<string, number>)[col] > 0).length;
  }

  const sorted = Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([col]) => DB_TO_DIMENSION[col]);

  return sorted.length >= count ? sorted : DEFAULT_DIMS;
}

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

const CAFE_SELECT_WITH_PHOTOS = `
  id, name, slug, address, district_id,
  latitude, longitude,
  overall_rating, total_ratings,
  rating_food, rating_drinks, rating_temperature, rating_seating,
  rating_ambiance, rating_wifi, rating_noise, rating_outlets, rating_value,
  price_range, cafe_type,
  has_wifi, has_power_outlets, is_pet_friendly, is_laptop_friendly, has_parking,
  photos(storage_path, upvote_count, status)
`;

type PhotoRow = { storage_path: string; upvote_count: number; status: string };

function transformToForYouCafe(row: Record<string, unknown>): ForYouCafe {
  const photos = row.photos as PhotoRow[] | null;
  const approvedPhotos = (photos || [])
    .filter((p) => p.status === 'approved')
    .sort((a, b) => b.upvote_count - a.upvote_count);

  const topPhoto = approvedPhotos[0];
  const summary = transformCafeSummary({
    ...row,
    primary_image_url: topPhoto?.storage_path || null,
  });

  return {
    ...summary,
    photoUrls: approvedPhotos
      .map((p) => getStorageUrl(p.storage_path))
      .filter((url): url is string => url != null),
  };
}

export async function getForYouCafes(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 30
): Promise<ForYouCafe[]> {
  const { data: recommendations, error: rpcError } = await supabase
    .rpc('get_recommendations', { p_user_id: userId, p_limit: limit });

  if (rpcError || !recommendations || recommendations.length === 0) {
    return [];
  }

  const cafeIds = (recommendations as RecommendationRow[]).map((r) => r.cafe_id);

  const { data: cafes, error: cafesError } = await supabase
    .from('cafes')
    .select(CAFE_SELECT_WITH_PHOTOS)
    .in('id', cafeIds)
    .eq('status', 'active');

  if (cafesError || !cafes) {
    return [];
  }

  const cafeMap = new Map<string, ForYouCafe>();
  for (const row of cafes) {
    cafeMap.set(row.id, transformToForYouCafe(row as Record<string, unknown>));
  }

  return cafeIds
    .map((id) => cafeMap.get(id))
    .filter((c): c is ForYouCafe => c != null);
}

export async function getPopularCafesWithPhotos(
  supabase: SupabaseClient,
  limit: number = 30
): Promise<ForYouCafe[]> {
  const { data: cafes, error } = await supabase
    .from('cafes')
    .select(CAFE_SELECT_WITH_PHOTOS)
    .eq('status', 'active')
    .order('total_ratings', { ascending: false })
    .order('overall_rating', { ascending: false })
    .limit(limit);

  if (error || !cafes) {
    return [];
  }

  return cafes.map((row) => transformToForYouCafe(row as Record<string, unknown>));
}
