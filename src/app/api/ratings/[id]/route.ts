import { NextRequest, NextResponse } from 'next/server';
import { deleteMyRating, submitRating } from '@/lib/actions/ratings';
import { createClient } from '@/lib/supabase/server';
import { ratingFormSchema } from '@/lib/validations/ratings';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ratings/:id
 * Get a specific rating by ID
 * Requires authentication and ownership verification
 *
 * Response: { rating: UserRating }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid rating ID format' },
        { status: 400 }
      );
    }

    // Verify authentication
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

    // Fetch the rating with ownership verification
    const { data: rating, error } = await supabase
      .from('cafe_ratings')
      .select(`
        *,
        user:profiles!inner(
          id,
          username,
          display_name,
          avatar_url
        ),
        cafe:cafes!inner(
          id,
          name,
          slug
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !rating) {
      return NextResponse.json(
        { error: 'Rating not found or not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ rating });
  } catch (error) {
    console.error('Error fetching rating:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ratings/:id
 * Update a specific rating
 * Delegates to submitRating Server Action (which uses upsert internally)
 * Requires rating ID in URL and cafeId in body
 *
 * Request body: Partial<RatingFormData>
 * Response: { rating: UserRating }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid rating ID format' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Verify ownership first
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

    // Check if rating exists and belongs to user
    const { data: existingRating, error: fetchError } = await supabase
      .from('cafe_ratings')
      .select('id, cafe_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingRating) {
      return NextResponse.json(
        { error: 'Rating not found or not authorized' },
        { status: 404 }
      );
    }

    // Validate the update data
    // For PATCH, we merge with defaults - overall is still required
    const mergedData = {
      cafeId: existingRating.cafe_id,
      overall: body.overall ?? 1, // Must be provided
      drinks: body.drinks ?? 0,
      wifi: body.wifi ?? 0,
      priceValue: body.priceValue ?? 0,
      quietness: body.quietness ?? 0,
      seating: body.seating ?? 0,
      comfort: body.comfort ?? 0,
      food: body.food ?? 0,
      petFriendly: body.petFriendly ?? false,
      lighting: body.lighting ?? 0,
      outlets: body.outlets ?? 0,
    };

    const validation = ratingFormSchema.safeParse(mergedData);
    if (!validation.success) {
      const issues = validation.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${issues}` },
        { status: 400 }
      );
    }

    // Use submitRating which handles upsert and cafe average updates
    const result = await submitRating(validation.data);

    if (!result.success) {
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

    return NextResponse.json(result.rating);
  } catch (error) {
    console.error('Error updating rating:', error);
    return NextResponse.json(
      { error: 'Failed to update rating' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ratings/:id
 * Delete a specific rating
 * Requires authentication and ownership verification
 * Updates cafe averages after deletion
 *
 * Response: { success: true }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid rating ID format' },
        { status: 400 }
      );
    }

    const result = await deleteMyRating(id);

    if (!result.success) {
      const status = result.error?.includes('Authentication')
        ? 401
        : result.error?.includes('not found')
          ? 404
          : result.error?.includes('not authorized')
            ? 403
            : 500;

      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return NextResponse.json(
      { error: 'Failed to delete rating' },
      { status: 500 }
    );
  }
}
