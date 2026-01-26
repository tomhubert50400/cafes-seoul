import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformCafeSummary } from '@/lib/supabase/transforms';
import type { CafeListParams, PaginatedResponse } from '@/types/api';
import type { CafeSummary } from '@/types/cafe';
import { getDistrictBySlug } from '@/lib/constants/districts';

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
      cafe_images(storage_path)
    `, { count: 'exact' })
    .eq('status', 'active');

  // Apply filters
  if (params.district) {
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

  if (params.q) {
    query = query.or(`name->ko.ilike.%${params.q}%,name->en.ilike.%${params.q}%,address->ko.ilike.%${params.q}%`);
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

  // Apply pagination
  query = query.range(offset, offset + params.limit! - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform data and get primary image
  const cafes: CafeSummary[] = (data || []).map((row) => {
    const images = row.cafe_images as { storage_path: string }[] | null;
    return transformCafeSummary({
      ...row,
      primary_image_url: images?.[0]?.storage_path || null,
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
