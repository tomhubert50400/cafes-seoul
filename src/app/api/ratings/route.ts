import { NextRequest, NextResponse } from 'next/server';
import { submitRating, getCafeRatingsList } from '@/lib/actions/ratings';

/**
 * GET /api/ratings?cafeId=xxx
 * Get ratings for a specific cafe
 * Supports pagination via limit and offset query params
 *
 * Response: { ratings: UserRating[], total: number, limit: number, offset: number }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cafeId = searchParams.get('cafeId');
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 1), 100);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);

    if (!cafeId) {
      return NextResponse.json(
        { error: 'cafeId query parameter required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cafeId)) {
      return NextResponse.json(
        { error: 'Invalid cafeId format' },
        { status: 400 }
      );
    }

    const result = await getCafeRatingsList(cafeId, { limit, offset });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ratings: result.ratings,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ratings
 * Submit or update a rating
 * Delegates to submitRating Server Action for consistency
 *
 * Request body: RatingFormData
 * Response: { rating: UserRating }
 * Status: 201 on success, 401 if not authenticated, 400 if validation fails
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const result = await submitRating(body);

    if (!result.success) {
      // Determine appropriate status code based on error
      const status = result.error?.includes('Authentication')
        ? 401
        : result.error?.includes('Validation')
          ? 400
          : 500;

      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return NextResponse.json(result.rating, { status: 201 });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}
