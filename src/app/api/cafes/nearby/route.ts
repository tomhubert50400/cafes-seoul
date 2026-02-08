import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformCafeSummary } from '@/lib/supabase/transforms';
import type { CafeSummary } from '@/types/cafe';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const supabase = await createClient();

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = parseInt(searchParams.get('radius') || '1000'); // default 1km
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'lat and lng parameters are required' },
      { status: 400 }
    );
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { error: 'Invalid lat or lng values' },
      { status: 400 }
    );
  }

  // Use the PostGIS function to find nearby cafes
  const { data, error } = await supabase.rpc('find_cafes_nearby', {
    lat: latitude,
    lng: longitude,
    radius_meters: radius,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Get full cafe details for the nearby cafes
  const cafeIds = data.slice(0, limit).map((c: { id: string }) => c.id);
  const distanceMap = new Map(
    data.map((c: { id: string; distance_meters: number }) => [c.id, c.distance_meters])
  );

  const { data: cafes, error: cafesError } = await supabase
    .from('cafes')
    .select(`
      id,
      name_ko,
      name_en,
      slug,
      address_ko,
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
      cafe_images(storage_path),
      photos(storage_path, upvote_count, status)
    `)
    .in('id', cafeIds)
    .neq('status', 'closed');

  if (cafesError) {
    return NextResponse.json({ error: cafesError.message }, { status: 500 });
  }

  // Transform and add distance
  const result: CafeSummary[] = (cafes || [])
    .map((row) => {
      const images = row.cafe_images as { storage_path: string }[] | null;
      return {
        ...transformCafeSummary({
          ...row,
          primary_image_url: images?.[0]?.storage_path || null,
        }),
        distance: distanceMap.get(row.id) as number,
      };
    })
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));

  return NextResponse.json({ data: result });
}
