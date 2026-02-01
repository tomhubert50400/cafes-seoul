import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PhotoStatus } from '@/types/photos';

// Helper to construct photo URL from storage path
function getPhotoUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured');
  }
  return `${supabaseUrl}/storage/v1/object/public/cafe-images/${storagePath}`;
}

/**
 * GET /api/photos?cafeId={id}&offset={n}&limit={6}
 * Get photos for a cafe with current user's vote status
 * Supports pagination and proper visibility rules
 *
 * Response: { photos: PhotoWithVoteStatus[], total: number, hasMore: boolean }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const cafeId = searchParams.get('cafeId');
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '6', 10), 20); // Max 20

    // Validate required parameter
    if (!cafeId) {
      return NextResponse.json(
        { error: 'cafeId query parameter is required' },
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

    // Build query for photos
    // Visibility rules:
    // - Approved photos visible to all
    // - User's own photos (any status) visible to them
    // - Rejected photos never visible to anyone except uploader
    let query = supabase
      .from('photos')
      .select(
        `
        id,
        storage_path,
        status,
        upvote_count,
        created_at,
        user_id
      `,
        { count: 'exact' }
      )
      .eq('cafe_id', cafeId);

    // Apply visibility filter
    if (user) {
      // Show: approved photos OR user's own photos (any status)
      // Don't show: rejected photos unless they belong to current user
      query = query.or(`status.eq.approved,user_id.eq.${user.id}`);
    } else {
      // Unauthenticated users only see approved photos
      query = query.eq('status', 'approved');
    }

    // Sort by upvote count descending, then by creation date
    // This ensures popular photos appear first (VOTE-03 requirement)
    query = query
      .order('upvote_count', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: photos, error, count } = await query;

    if (error) {
      console.error('Error fetching photos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      );
    }

    // Get user's votes for these photos (if authenticated)
    let userVotes: Set<string> = new Set();
    if (user && photos && photos.length > 0) {
      const photoIds = photos.map((p) => p.id);
      const { data: votes, error: votesError } = await supabase
        .from('photo_votes')
        .select('photo_id')
        .eq('user_id', user.id)
        .in('photo_id', photoIds);

      if (!votesError && votes) {
        userVotes = new Set(votes.map((v) => v.photo_id));
      }
    }

    // Transform photos for response
    // Include both snake_case (database) and camelCase (client) properties
    const transformedPhotos = (photos || []).map((photo) => ({
      id: photo.id,
      storage_path: photo.storage_path,
      url: getPhotoUrl(photo.storage_path),
      status: photo.status as PhotoStatus,
      upvote_count: photo.upvote_count,
      upvoteCount: photo.upvote_count,
      created_at: photo.created_at,
      hasVoted: userVotes.has(photo.id),
      isOwnPhoto: user ? photo.user_id === user.id : false,
    }));

    const total = count || 0;
    const hasMore = total > offset + limit;

    return NextResponse.json({
      photos: transformedPhotos,
      total,
      hasMore,
    });
  } catch (error) {
    console.error('Unexpected error in photos API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/photos
 * Upload a photo via API
 * Delegates to uploadPhoto Server Action for consistency
 *
 * Note: For file uploads via API, use multipart/form-data
 * But since we have comprehensive Server Actions, recommend using those
 */
export async function POST(request: NextRequest) {
  try {
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

    // For API route, delegate to Server Action or handle multipart
    // Since we have comprehensive Server Actions, recommend using those
    return NextResponse.json(
      {
        error: 'Use uploadPhoto Server Action instead',
        hint: 'Import { uploadPhoto } from "@/lib/actions/photos"',
        docs: 'Server Actions handle file uploads with proper validation',
      },
      { status: 405 }
    );
  } catch (error) {
    console.error('Error in photos API POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
