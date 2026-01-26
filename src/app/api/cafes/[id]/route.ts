import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformCafe } from '@/lib/supabase/transforms';
import type { CafeImage } from '@/types/cafe';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Check if id is a UUID or slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let query = supabase
    .from('cafes')
    .select('*')
    .eq('status', 'active');

  if (isUuid) {
    query = query.eq('id', id);
  } else {
    query = query.eq('slug', id);
  }

  const { data: cafe, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch images separately
  const { data: images } = await supabase
    .from('cafe_images')
    .select('id, storage_path, thumbnail_path, alt_text, is_primary, created_at')
    .eq('cafe_id', cafe.id)
    .eq('is_approved', true)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  const transformedCafe = transformCafe(cafe);
  const transformedImages: CafeImage[] = (images || []).map((img) => ({
    id: img.id,
    cafeId: cafe.id,
    storagePath: img.storage_path,
    thumbnailPath: img.thumbnail_path,
    altText: img.alt_text || {},
    isPrimary: img.is_primary,
    createdAt: img.created_at,
  }));

  return NextResponse.json({
    data: {
      ...transformedCafe,
      images: transformedImages,
    },
  });
}
