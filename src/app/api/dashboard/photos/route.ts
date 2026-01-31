import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dashboard/photos
 * Fetch user's uploaded photos with pagination
 * Query params: offset, limit
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse query params
    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '6', 10), 20);

    // 3. Query photos with cafe join
    const { data: photos, error } = await supabase
      .from('photos')
      .select('id, storage_path, status, upvote_count, created_at, rejection_reason, cafe:cafes(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching photos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      );
    }

    return NextResponse.json(photos || []);
  } catch (error) {
    console.error('Unexpected error in photos API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
