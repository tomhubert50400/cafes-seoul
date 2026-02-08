'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { submissionSchema } from '@/lib/validations/submission';
import {
  createSubmission,
  updateSubmission as updateSubmissionDb,
  deleteSubmission as deleteSubmissionDb,
  getUserSubmissions,
  getSubmissionById,
  getRateLimit,
  incrementRateLimit,
  findDuplicateCafes,
  getSubmissionStatistics,
  checkKakaoPlaceIdExists,
} from '@/lib/supabase/submissions';
import type {
  CafeSubmission,
  SubmissionStatus,
  SubmissionRateLimit,
  SubmissionStatistics,
} from '@/types/submission';
import type { SubmissionFormData } from '@/lib/validations/submission';
import type { CafeSummary } from '@/types/cafe';

// ============================================
// SUBMIT CAFE
// ============================================

/**
 * Submit a new cafe for admin approval
 * Enforces rate limiting (3 submissions per day)
 * @returns Success status with submission data or error
 */
export async function submitCafe(
  data: SubmissionFormData
): Promise<{
  success: boolean;
  submission?: CafeSubmission;
  error?: string;
  rateLimit?: SubmissionRateLimit;
}> {
  try {
    // 1. Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Check rate limit
    const rateCheck = await incrementRateLimit(supabase, user.id);
    if (!rateCheck.success) {
      return {
        success: false,
        error: rateCheck.error,
        rateLimit: rateCheck.rateLimit,
      };
    }

    // 3. Validate input
    const validation = submissionSchema.safeParse(data);
    if (!validation.success) {
      const issues = validation.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: `Validation failed: ${issues}` };
    }

    // 4. Check for kakao_place_id duplicate (server-side enforcement)
    if (validation.data.kakaoPlaceId) {
      const kakaoCheck = await checkKakaoPlaceIdExists(supabase, validation.data.kakaoPlaceId);
      if (kakaoCheck.exists) {
        const errorMsg = kakaoCheck.foundIn === 'cafes'
          ? 'This cafe already exists in our directory'
          : 'This cafe has already been submitted and is pending review';
        return { success: false, error: errorMsg };
      }
    }

    // 5. Create submission
    const result = await createSubmission(supabase, user.id, validation.data);

    if ('error' in result) {
      return { success: false, error: result.error };
    }

    // 6. Revalidate profile submissions page
    revalidatePath('/profile/submissions');

    // 7. Return success with rate limit info
    return {
      success: true,
      submission: result,
      rateLimit: rateCheck.rateLimit,
    };
  } catch (err) {
    console.error('Unexpected error submitting cafe:', err);
    return { success: false, error: 'Failed to submit cafe' };
  }
}

// ============================================
// UPDATE SUBMISSION
// ============================================

/**
 * Update an existing pending submission
 * Only allowed for pending submissions owned by the current user
 * @returns Success status with updated submission or error
 */
export async function updateSubmission(
  submissionId: string,
  data: SubmissionFormData
): Promise<{
  success: boolean;
  submission?: CafeSubmission;
  error?: string;
}> {
  try {
    // 1. Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Validate input
    const validation = submissionSchema.safeParse(data);
    if (!validation.success) {
      const issues = validation.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: `Validation failed: ${issues}` };
    }

    // 3. Update submission (db function checks ownership and status)
    const result = await updateSubmissionDb(
      supabase,
      submissionId,
      user.id,
      validation.data
    );

    if ('error' in result) {
      return { success: false, error: result.error };
    }

    // 4. Revalidate profile submissions page
    revalidatePath('/profile/submissions');

    return { success: true, submission: result };
  } catch (err) {
    console.error('Unexpected error updating submission:', err);
    return { success: false, error: 'Failed to update submission' };
  }
}

// ============================================
// DELETE SUBMISSION
// ============================================

/**
 * Delete a pending submission
 * Only allowed for pending submissions owned by the current user
 * @returns Success status or error
 */
export async function deleteSubmission(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Delete submission (db function checks ownership and status)
    const result = await deleteSubmissionDb(supabase, submissionId, user.id);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // 3. Revalidate profile submissions page
    revalidatePath('/profile/submissions');

    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting submission:', err);
    return { success: false, error: 'Failed to delete submission' };
  }
}

// ============================================
// CHECK DUPLICATES
// ============================================

/**
 * Check for potential duplicate cafes before submission
 * No authentication required - can be checked before login
 * @returns Array of potential duplicate cafes
 */
export async function checkDuplicateSubmissions(
  name: Record<string, string>,
  address: Record<string, string>
): Promise<{
  success: boolean;
  duplicates?: CafeSummary[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const duplicates = await findDuplicateCafes(supabase, name, address);

    return { success: true, duplicates };
  } catch (err) {
    console.error('Unexpected error checking duplicates:', err);
    return { success: false, error: 'Failed to check for duplicates' };
  }
}

// ============================================
// CHECK KAKAO PLACE ID DUPLICATE
// ============================================

/**
 * Check if a kakao_place_id already exists in cafes or submissions
 * No authentication required - can be checked before submission
 */
export async function checkKakaoPlaceIdDuplicate(
  kakaoPlaceId: string
): Promise<{
  success: boolean;
  exists?: boolean;
  foundIn?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const result = await checkKakaoPlaceIdExists(supabase, kakaoPlaceId);

    return { success: true, exists: result.exists, foundIn: result.foundIn };
  } catch (err) {
    console.error('Unexpected error checking kakao place id:', err);
    return { success: false, error: 'Failed to check for duplicates' };
  }
}

// ============================================
// GET MY SUBMISSIONS
// ============================================

/**
 * Get current user's submissions
 * @returns Array of submissions for the authenticated user
 */
export async function getMySubmissions(
  status?: SubmissionStatus
): Promise<{
  success: boolean;
  submissions?: CafeSubmission[];
  error?: string;
}> {
  try {
    // 1. Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Get submissions
    const submissions = await getUserSubmissions(supabase, user.id, {
      status: status || null,
    });

    return { success: true, submissions };
  } catch (err) {
    console.error('Unexpected error fetching submissions:', err);
    return { success: false, error: 'Failed to fetch submissions' };
  }
}

// ============================================
// GET SINGLE SUBMISSION
// ============================================

/**
 * Get a single submission by ID
 * Verifies ownership (only returns user's own submissions)
 * @returns Submission or error if not found/unauthorized
 */
export async function getMySubmission(
  submissionId: string
): Promise<{
  success: boolean;
  submission?: CafeSubmission;
  error?: string;
}> {
  try {
    // 1. Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Get submission with ownership check
    const submission = await getSubmissionById(supabase, submissionId, user.id);

    if (!submission) {
      return { success: false, error: 'Submission not found' };
    }

    return { success: true, submission };
  } catch (err) {
    console.error('Unexpected error fetching submission:', err);
    return { success: false, error: 'Failed to fetch submission' };
  }
}

// ============================================
// RATE LIMIT STATUS
// ============================================

/**
 * Get current user's rate limit status
 * @returns Rate limit info or null (null means full quota available)
 */
export async function getRateLimitStatus(): Promise<{
  success: boolean;
  rateLimit?: SubmissionRateLimit | null;
  error?: string;
}> {
  try {
    // 1. Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Get rate limit
    const rateLimit = await getRateLimit(supabase, user.id);

    return { success: true, rateLimit };
  } catch (err) {
    console.error('Unexpected error fetching rate limit:', err);
    return { success: false, error: 'Failed to fetch rate limit' };
  }
}

// ============================================
// SUBMISSION STATISTICS
// ============================================

/**
 * Get submission statistics for the current user
 * @returns Statistics with total, pending, approved, declined counts
 */
export async function getMySubmissionStatistics(): Promise<{
  success: boolean;
  statistics?: SubmissionStatistics;
  error?: string;
}> {
  try {
    // 1. Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Get statistics
    const statistics = await getSubmissionStatistics(supabase, user.id);

    return { success: true, statistics };
  } catch (err) {
    console.error('Unexpected error fetching statistics:', err);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}
