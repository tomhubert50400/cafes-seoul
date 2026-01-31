import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dashboard/ratings
 * Fetch user's cafe ratings with pagination
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 20);

    // 3. Query cafe_ratings with cafe join
    const { data: ratings, error } = await supabase
      .from('cafe_ratings')
      .select('id, overall, created_at, cafe:cafes(id, name, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching ratings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ratings' },
        { status: 500 }
      );
    }

    return NextResponse.json(ratings || []);
  } catch (error) {
    console.error('Unexpected error in ratings API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
