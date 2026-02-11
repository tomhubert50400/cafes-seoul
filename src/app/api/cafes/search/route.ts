import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformCafeSummary } from '@/lib/supabase/transforms';
import type { CafeSummary } from '@/types/cafe';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const supabase = await createClient();

  const q = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: 'Search query must be at least 2 characters' },
      { status: 400 }
    );
  }

  // Search across all languages (name + address JSONB fields)
  const { data, error } = await supabase
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
    `)
    .eq('status', 'active')
    .or(
      `name->>ko.ilike.%${q}%,name->>en.ilike.%${q}%,name->>fr.ilike.%${q}%,name->>zh.ilike.%${q}%,name->>vi.ilike.%${q}%,address->>ko.ilike.%${q}%,address->>en.ilike.%${q}%,address->>fr.ilike.%${q}%,address->>zh.ilike.%${q}%,address->>vi.ilike.%${q}%,specialties.cs.{${q}}`
    )
    .order('overall_rating', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  return NextResponse.json({ data: cafes });
}
