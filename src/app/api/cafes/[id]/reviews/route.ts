import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformReview } from '@/lib/supabase/transforms';
import type { PaginatedResponse, ReviewListParams } from '@/types/api';
import type { Review } from '@/types/review';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cafeId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const supabase = await createClient();

  const queryParams: ReviewListParams = {
    page: parseInt(searchParams.get('page') || '1'),
    limit: Math.min(parseInt(searchParams.get('limit') || '10'), 50),
    sortBy: (searchParams.get('sortBy') as ReviewListParams['sortBy']) || 'newest',
  };

  const offset = (queryParams.page! - 1) * queryParams.limit!;

  // Get current user for vote status
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('reviews')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        display_name,
        avatar_url,
        is_verified,
        total_reviews
      )
    `, { count: 'exact' })
    .eq('cafe_id', cafeId)
    .eq('status', 'active');

  // Apply sorting
  switch (queryParams.sortBy) {
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'helpful':
      query = query.order('helpful_count', { ascending: false });
      break;
    case 'rating_high':
      query = query.order('rating_overall', { ascending: false });
      break;
    case 'rating_low':
      query = query.order('rating_overall', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + queryParams.limit! - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If user is logged in, get their votes for these reviews
  let userVotes: Map<string, boolean> = new Map();
  if (user && data && data.length > 0) {
    const reviewIds = data.map((r) => r.id);
    const { data: votes } = await supabase
      .from('review_votes')
      .select('review_id, is_helpful')
      .eq('user_id', user.id)
      .in('review_id', reviewIds);

    if (votes) {
      votes.forEach((v) => {
        userVotes.set(v.review_id, v.is_helpful);
      });
    }
  }

  const reviews: Review[] = (data || []).map((row) => ({
    ...transformReview(row),
    userVote: userVotes.get(row.id) ?? null,
  }));

  const response: PaginatedResponse<Review> = {
    data: reviews,
    meta: {
      total: count || 0,
      page: queryParams.page!,
      limit: queryParams.limit!,
      totalPages: Math.ceil((count || 0) / queryParams.limit!),
    },
  };

  return NextResponse.json(response);
}
