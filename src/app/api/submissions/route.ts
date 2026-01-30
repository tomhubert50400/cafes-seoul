import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSubmissions } from '@/lib/supabase/submissions';
import type { SubmissionStatus } from '@/types/submission';

/**
 * GET /api/submissions
 * List current user's submissions
 * Supports optional status filter via query param: ?status=pending
 *
 * Response: { submissions: CafeSubmission[] }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as SubmissionStatus | null;

    const submissions = await getUserSubmissions(supabase, user.id, {
      status: status || null,
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/submissions
 * Create new submission via API
 * Note: Server Actions are preferred for form submissions, this is for API clients
 *
 * Request body: SubmissionFormData
 * Response: { submission: CafeSubmission }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For API route, delegate to Server Action or implement here
    // Since we have comprehensive Server Actions, recommend using those
    return NextResponse.json(
      {
        error: 'Use submitCafe Server Action instead',
        hint: 'Import { submitCafe } from "@/lib/actions/submissions"',
      },
      { status: 405 }
    );
  } catch (error) {
    console.error('Error in submissions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
