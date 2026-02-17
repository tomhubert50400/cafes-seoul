import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformCafeSummary, extractPhotoData } from '@/lib/supabase/transforms';
import type { CafeListParams, PaginatedResponse } from '@/types/api';
import type { CafeSummary } from '@/types/cafe';
import { getDistrictBySlug, POPULAR_NEIGHBORHOODS, NEIGHBORHOOD_RADIUS_M } from '@/lib/constants/districts';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const supabase = await createClient();

  // Parse query parameters
  const params: CafeListParams = {
    page: parseInt(searchParams.get('page') || '1'),
    limit: Math.min(parseInt(searchParams.get('limit') || '20'), 50),
    district: searchParams.get('district') || undefined,
    neighborhood: searchParams.get('neighborhood') || undefined,
    minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
    priceRange: searchParams.get('priceRange') || undefined,
    cafeType: searchParams.get('cafeType') as CafeListParams['cafeType'],
    hasWifi: searchParams.get('hasWifi') === 'true' ? true : undefined,
    hasOutlets: searchParams.get('hasOutlets') === 'true' ? true : undefined,
    isPetFriendly: searchParams.get('isPetFriendly') === 'true' ? true : undefined,
    isLaptopFriendly: searchParams.get('isLaptopFriendly') === 'true' ? true : undefined,
    hasParking: searchParams.get('hasParking') === 'true' ? true : undefined,
    hasOutdoorSeating: searchParams.get('hasOutdoorSeating') === 'true' ? true : undefined,
    seatingMin: searchParams.get('seatingMin') ? parseInt(searchParams.get('seatingMin')!) : undefined,
    serviceMin: searchParams.get('serviceMin') ? parseInt(searchParams.get('serviceMin')!) : undefined,
    foodMin: searchParams.get('foodMin') ? parseInt(searchParams.get('foodMin')!) : undefined,
    drinksMin: searchParams.get('drinksMin') ? parseInt(searchParams.get('drinksMin')!) : undefined,
    lightingMin: searchParams.get('lightingMin') ? parseInt(searchParams.get('lightingMin')!) : undefined,
    aestheticMin: searchParams.get('aestheticMin') ? parseInt(searchParams.get('aestheticMin')!) : undefined,
    quietnessMin: searchParams.get('quietnessMin') ? parseInt(searchParams.get('quietnessMin')!) : undefined,
    priceValueMin: searchParams.get('priceValueMin') ? parseInt(searchParams.get('priceValueMin')!) : undefined,
    comfortMin: searchParams.get('comfortMin') ? parseInt(searchParams.get('comfortMin')!) : undefined,
    openNow: searchParams.get('openNow') === 'true' ? true : undefined,
    favoritesOnly: searchParams.get('favoritesOnly') === 'true' ? true : undefined,
    cafeIds: searchParams.get('cafeIds') || undefined,
    sortBy: (searchParams.get('sortBy') as CafeListParams['sortBy']) || 'rating',
    sortOrder: (searchParams.get('sortOrder') as CafeListParams['sortOrder']) || 'desc',
    q: searchParams.get('q') || undefined,
  };

  const offset = (params.page! - 1) * params.limit!;

  // Build query
  let query = supabase
    .from('cafes')
    .select(`
      id,
      name,
      slug,
      address,
      district_id,
      latitude,
      longitude,
      overall_rating,
      total_ratings,
      price_range,
      cafe_type,
      has_wifi,
      has_power_outlets,
      is_pet_friendly,
      is_laptop_friendly,
      operating_hours,
      photos(storage_path, upvote_count, status)
    `, { count: 'exact' })
    .eq('status', 'active');

  // Apply location filters
  if (params.neighborhood) {
    // Neighborhood proximity filtering using bounding box
    const neighborhood = POPULAR_NEIGHBORHOODS.find((n) => n.slug === params.neighborhood);
    if (neighborhood) {
      // At Seoul's latitude (~37.5°): 1° lat ≈ 111km, 1° lng ≈ 88km
      const deltaLat = NEIGHBORHOOD_RADIUS_M / 111000;
      const deltaLng = NEIGHBORHOOD_RADIUS_M / (111000 * Math.cos((neighborhood.lat * Math.PI) / 180));
      query = query
        .gte('latitude', neighborhood.lat - deltaLat)
        .lte('latitude', neighborhood.lat + deltaLat)
        .gte('longitude', neighborhood.lng - deltaLng)
        .lte('longitude', neighborhood.lng + deltaLng);
    }
  } else if (params.district) {
    const district = getDistrictBySlug(params.district);
    if (district) {
      query = query.eq('district_id', district.id);
    }
  }

  if (params.minRating) {
    query = query.gte('overall_rating', params.minRating);
  }

  if (params.priceRange) {
    const ranges = params.priceRange.split(',').map(Number);
    query = query.in('price_range', ranges);
  }

  if (params.cafeType) {
    query = query.eq('cafe_type', params.cafeType);
  }

  if (params.hasWifi) {
    query = query.eq('has_wifi', true);
  }

  if (params.hasOutlets) {
    query = query.eq('has_power_outlets', true);
  }

  if (params.isPetFriendly) {
    query = query.eq('is_pet_friendly', true);
  }

  if (params.isLaptopFriendly) {
    query = query.eq('is_laptop_friendly', true);
  }

  if (params.hasParking) {
    query = query.eq('has_parking', true);
  }

  if (params.hasOutdoorSeating) {
    query = query.eq('has_outdoor_seating', true);
  }

  // Favorites filter: restrict to specific cafe IDs (passed from page)
  if (params.cafeIds) {
    const ids = params.cafeIds.split(',').filter(Boolean);
    if (ids.length > 0) {
      query = query.in('id', ids);
    } else {
      return NextResponse.json({
        data: [],
        meta: { total: 0, page: params.page!, limit: params.limit!, totalPages: 0 },
      } satisfies PaginatedResponse<CafeSummary>);
    }
  }

  // Rating dimension filters
  if (params.seatingMin) query = query.gte('rating_seating', params.seatingMin);
  if (params.serviceMin) query = query.gte('rating_service', params.serviceMin);
  if (params.foodMin) query = query.gte('rating_food', params.foodMin);
  if (params.drinksMin) query = query.gte('rating_drinks', params.drinksMin);
  if (params.lightingMin) query = query.gte('rating_lighting', params.lightingMin);
  if (params.aestheticMin) query = query.gte('rating_aesthetic', params.aestheticMin);
  if (params.quietnessMin) query = query.gte('rating_quietness', params.quietnessMin);
  if (params.priceValueMin) query = query.gte('rating_price_value', params.priceValueMin);
  if (params.comfortMin) query = query.gte('rating_comfort', params.comfortMin);

  if (params.q) {
    // Uses generated search_text column with trigram GIN index
    // (replaces 10 ILIKE conditions across 5 language JSONB fields)
    query = query.ilike('search_text', `%${params.q}%`);
  }

  // Apply sorting
  switch (params.sortBy) {
    case 'rating':
      query = query.order('overall_rating', { ascending: params.sortOrder === 'asc' });
      break;
    case 'reviews':
      query = query.order('total_ratings', { ascending: params.sortOrder === 'asc' });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: params.sortOrder === 'asc' });
      break;
    default:
      query = query.order('overall_rating', { ascending: false });
  }

  // When openNow is active, pre-filter using DB-level RPC
  if (params.openNow) {
    const { data: openIds } = await supabase.rpc('get_open_cafe_ids');
    if (openIds && openIds.length > 0) {
      query = query.in('id', openIds);
    } else {
      // No cafes open right now
      return NextResponse.json({
        data: [],
        meta: { total: 0, page: params.page!, limit: params.limit!, totalPages: 0 },
      } satisfies PaginatedResponse<CafeSummary>);
    }
  }

  // Apply pagination
  query = query.range(offset, offset + params.limit! - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform data and get primary image from top approved photo
  const cafes: CafeSummary[] = (data || []).map((row) => {
    const photos = row.photos as { storage_path: string; upvote_count: number; status: string }[] | null;
    const topPhoto = photos
      ?.filter((p) => p.status === 'approved')
      .sort((a, b) => b.upvote_count - a.upvote_count)[0];
    return transformCafeSummary({
      ...row,
      primary_image_url: topPhoto?.storage_path || null,
    });
  });

  const response: PaginatedResponse<CafeSummary> = {
    data: cafes,
    meta: {
      total: count || 0,
      page: params.page!,
      limit: params.limit!,
      totalPages: Math.ceil((count || 0) / params.limit!),
    },
  };

  return NextResponse.json(response);
}
