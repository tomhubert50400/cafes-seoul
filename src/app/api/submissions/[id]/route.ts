import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
} from '@/lib/supabase/submissions';
import type { CafeSubmissionInput } from '@/types/submission';
import { submissionSchema } from '@/lib/validations/submission';

/**
 * GET /api/submissions/[id]
 * Get a single submission by ID
 * Verifies ownership (only returns user's own submissions)
 *
 * Response: { submission: CafeSubmission }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const submission = await getSubmissionById(supabase, id, user.id);

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/submissions/[id]
 * Update a submission
 * Only allowed for pending submissions owned by the user
 *
 * Request body: Partial<SubmissionFormData>
 * Response: { submission: CafeSubmission }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // For PATCH, we need to validate that if name/address are provided, they're valid
    // But we allow partial updates (some fields missing)
    // First, get the existing submission to merge with updates
    const { id } = await params;
    const existing = await getSubmissionById(supabase, id, user.id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Merge existing data with updates
    const mergedData = {
      name: body.name ?? existing.name,
      address: body.address ?? existing.address,
      phone: body.phone ?? existing.phone ?? undefined,
      latitude: body.latitude ?? existing.latitude ?? undefined,
      longitude: body.longitude ?? existing.longitude ?? undefined,
      districtId: body.districtId ?? existing.districtId ?? undefined,
      neighborhoodId: body.neighborhoodId ?? existing.neighborhoodId ?? undefined,
    };

    // Validate merged data
    const validation = submissionSchema.safeParse(mergedData);
    if (!validation.success) {
      const issues = validation.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json(
        { error: `Validation failed: ${issues}` },
        { status: 400 }
      );
    }

    const result = await updateSubmission(supabase, id, user.id, validation.data);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ submission: result });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/submissions/[id]
 * Delete a submission
 * Only allowed for pending submissions owned by the user
 *
 * Response: { success: true }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await deleteSubmission(supabase, id, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete submission' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    );
  }
}
