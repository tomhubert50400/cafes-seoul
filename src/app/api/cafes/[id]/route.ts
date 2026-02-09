import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformCafe, getStorageUrl } from '@/lib/supabase/transforms';

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

  // Fetch approved photos
  const { data: photos } = await supabase
    .from('photos')
    .select('id, storage_path, upvote_count, created_at')
    .eq('cafe_id', cafe.id)
    .eq('status', 'approved')
    .order('upvote_count', { ascending: false })
    .order('created_at', { ascending: false });

  const transformedCafe = transformCafe(cafe);
  const transformedPhotos = (photos || []).map((photo) => ({
    id: photo.id,
    storagePath: getStorageUrl(photo.storage_path) || '',
    url: getStorageUrl(photo.storage_path) || '',
    upvoteCount: photo.upvote_count,
    createdAt: photo.created_at,
  }));

  return NextResponse.json({
    data: {
      ...transformedCafe,
      photos: transformedPhotos,
    },
  });
}
