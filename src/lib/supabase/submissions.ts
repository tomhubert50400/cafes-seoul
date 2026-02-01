import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CafeSubmission,
  CafeSubmissionInput,
  CafeSubmissionUpdate,
  SubmissionRateLimit,
  SubmissionStatus,
  SubmissionStatistics,
  SubmissionWithUser,
} from '@/types/submission';
import type { CafeSummary, TranslatedText } from '@/types/cafe';
import {
  transformCafeSubmission,
  transformSubmissionRateLimit,
} from './transforms';

// ============================================
// SUBMISSION CRUD OPERATIONS
// ============================================

/**
 * Create a new cafe submission
 * @returns Created submission or error object
 */
export async function createSubmission(
  supabase: SupabaseClient,
  userId: string,
  data: CafeSubmissionInput
): Promise<CafeSubmission | { error: string }> {
  try {
    const { data: result, error } = await supabase
      .from('cafe_submissions')
      .insert({
        user_id: userId,
        name: data.name,
        address: data.address,
        phone: data.phone || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        district_id: data.districtId || null,
        neighborhood_id: data.neighborhoodId || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating submission:', error);
      return { error: error.message };
    }

    return transformCafeSubmission(result);
  } catch (err) {
    console.error('Unexpected error creating submission:', err);
    return { error: 'Failed to create submission' };
  }
}

/**
 * Update a submission - only allowed if status is 'pending' and user owns it
 * @returns Updated submission or error object
 */
export async function updateSubmission(
  supabase: SupabaseClient,
  submissionId: string,
  userId: string,
  data: CafeSubmissionUpdate
): Promise<CafeSubmission | { error: string }> {
  try {
    // First check if submission exists and is owned by user with pending status
    const { data: existing, error: fetchError } = await supabase
      .from('cafe_submissions')
      .select('*')
      .eq('id', submissionId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !existing) {
      return { error: 'Submission not found or cannot be edited' };
    }

    const { data: result, error } = await supabase
      .from('cafe_submissions')
      .update({
        name: data.name,
        address: data.address,
        phone: data.phone || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        district_id: data.districtId || null,
        neighborhood_id: data.neighborhoodId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating submission:', error);
      return { error: error.message };
    }

    return transformCafeSubmission(result);
  } catch (err) {
    console.error('Unexpected error updating submission:', err);
    return { error: 'Failed to update submission' };
  }
}

/**
 * Delete a submission - only allowed if status is 'pending' and user owns it
 * @returns Success boolean or error object
 */
export async function deleteSubmission(
  supabase: SupabaseClient,
  submissionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First check if submission exists and is owned by user with pending status
    const { data: existing, error: fetchError } = await supabase
      .from('cafe_submissions')
      .select('id')
      .eq('id', submissionId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'Submission not found or cannot be deleted' };
    }

    const { error } = await supabase
      .from('cafe_submissions')
      .delete()
      .eq('id', submissionId);

    if (error) {
      console.error('Error deleting submission:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting submission:', err);
    return { success: false, error: 'Failed to delete submission' };
  }
}

/**
 * Get all submissions for a user with optional status filter
 * @returns Array of submissions
 */
export async function getUserSubmissions(
  supabase: SupabaseClient,
  userId: string,
  options?: { status?: SubmissionStatus | null }
): Promise<CafeSubmission[]> {
  try {
    let query = supabase
      .from('cafe_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user submissions:', error);
      return [];
    }

    const submissions = data.map(transformCafeSubmission);

    // For approved submissions, fetch the linked cafe data to get full translations
    const approvedWithCafeId = submissions.filter(s => s.status === 'approved' && s.cafeId);
    if (approvedWithCafeId.length > 0) {
      const cafeIds = approvedWithCafeId.map(s => s.cafeId).filter(Boolean) as string[];
      const { data: cafes } = await supabase
        .from('cafes')
        .select('id, name, address, slug')
        .in('id', cafeIds);

      if (cafes) {
        const cafeMap = new Map(cafes.map(c => [c.id, c]));
        for (const submission of submissions) {
          if (submission.cafeId && cafeMap.has(submission.cafeId)) {
            const cafe = cafeMap.get(submission.cafeId)!;
            // Use cafe's translated name/address instead of submission's original
            submission.name = cafe.name as TranslatedText;
            submission.address = cafe.address as TranslatedText;
          }
        }
      }
    }

    return submissions;
  } catch (err) {
    console.error('Unexpected error fetching submissions:', err);
    return [];
  }
}

/**
 * Get a single submission by ID
 * If userId is provided, verifies ownership (or user must be admin)
 * @returns Submission or null if not found/unauthorized
 */
export async function getSubmissionById(
  supabase: SupabaseClient,
  submissionId: string,
  userId?: string
): Promise<CafeSubmission | null> {
  try {
    let query = supabase
      .from('cafe_submissions')
      .select('*')
      .eq('id', submissionId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return null;
    }

    return transformCafeSubmission(data);
  } catch (err) {
    console.error('Unexpected error fetching submission:', err);
    return null;
  }
}

/**
 * Get submission with user information (for admin view)
 * @returns Submission with user data or null
 */
export async function getSubmissionWithUser(
  supabase: SupabaseClient,
  submissionId: string
): Promise<SubmissionWithUser | null> {
  try {
    const { data, error } = await supabase
      .from('cafe_submissions')
      .select(`
        *,
        user:profiles!inner(
          id,
          email,
          display_name,
          avatar_url,
          role
        )
      `)
      .eq('id', submissionId)
      .single();

    if (error || !data) {
      console.error('Error fetching submission with user:', error);
      return null;
    }

    const submission = transformCafeSubmission(data);
    const userData = data.user as Record<string, unknown>;

    return {
      ...submission,
      user: {
        id: userData.id as string,
        email: userData.email as string,
        displayName: userData.display_name as string | null,
        avatarUrl: userData.avatar_url as string | null,
        role: userData.role as import('@/types/user').UserRole,
      },
    };
  } catch (err) {
    console.error('Unexpected error fetching submission with user:', err);
    return null;
  }
}

/**
 * Get all pending submissions with user info (for admin)
 * @returns Array of submissions with user data
 */
export async function getPendingSubmissions(
  supabase: SupabaseClient,
  options?: { limit?: number; offset?: number }
): Promise<SubmissionWithUser[]> {
  try {
    let query = supabase
      .from('cafe_submissions')
      .select(`
        *,
        user:profiles!inner(
          id,
          email,
          display_name,
          avatar_url,
          role
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pending submissions:', error);
      return [];
    }

    return data.map((row) => {
      const submission = transformCafeSubmission(row);
      const userData = row.user as Record<string, unknown>;

      return {
        ...submission,
        user: {
          id: userData.id as string,
          email: userData.email as string,
          displayName: userData.display_name as string | null,
          avatarUrl: userData.avatar_url as string | null,
          role: userData.role as import('@/types/user').UserRole,
        },
      };
    });
  } catch (err) {
    console.error('Unexpected error fetching pending submissions:', err);
    return [];
  }
}

// ============================================
// DUPLICATE DETECTION
// ============================================

/**
 * Find potential duplicate cafes using similarity matching
 * Uses pg_trgm extension for fuzzy name matching and address substring matching
 * @returns Top 5 potential duplicate CafeSummary objects
 */
export async function findDuplicateCafes(
  supabase: SupabaseClient,
  name: TranslatedText,
  address: TranslatedText
): Promise<CafeSummary[]> {
  try {
    // Get search terms from name (prioritize English, fallback to Korean)
    const searchName = name.en || name.ko || '';
    const searchAddress = address.en || address.ko || '';

    if (!searchName && !searchAddress) {
      return [];
    }

    // Use RPC function for duplicate detection with similarity
    // This uses pg_trgm extension for fuzzy matching
    const { data, error } = await supabase.rpc('find_duplicate_cafes', {
      search_name: searchName,
      search_address: searchAddress,
      max_results: 5,
    });

    if (error) {
      // If RPC doesn't exist, fall back to basic ILIKE matching
      console.warn('Duplicate detection RPC not available, using fallback:', error.message);
      return findDuplicateCafesFallback(supabase, searchName, searchAddress);
    }

    return data || [];
  } catch (err) {
    console.error('Error finding duplicates:', err);
    return [];
  }
}

/**
 * Fallback duplicate detection using basic ILIKE matching
 * Used when pg_trgm RPC is not available
 */
async function findDuplicateCafesFallback(
  supabase: SupabaseClient,
  name: string,
  address: string
): Promise<CafeSummary[]> {
  try {
    // Build a simple search pattern
    const namePattern = name.length > 3 ? `%${name.slice(0, -2)}%` : `%${name}%`;
    const addressPattern = address.length > 5 ? `%${address.slice(0, -3)}%` : `%${address}%`;

    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('status', 'approved')
      .or(
        `name->>en.ilike.${namePattern},name->>ko.ilike.${namePattern}`
      )
      .limit(5);

    if (error || !data) {
      return [];
    }

    // Import transformCafeSummary dynamically to avoid circular dependency issues
    const { transformCafeSummary } = await import('./transforms');
    return data.map(transformCafeSummary);
  } catch (err) {
    console.error('Error in fallback duplicate detection:', err);
    return [];
  }
}

// ============================================
// RATE LIMITING
// ============================================

/**
 * Get current rate limit status for a user
 * Returns null if no rate limit record exists (meaning user has full quota)
 */
export async function getRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<SubmissionRateLimit | null> {
  try {
    const { data, error } = await supabase
      .from('submission_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    const rateLimit = transformSubmissionRateLimit(data);

    // Check if reset time has passed - if so, return null to indicate fresh quota
    if (new Date(rateLimit.resetAt) < new Date()) {
      // Delete the old record
      await supabase
        .from('submission_rate_limits')
        .delete()
        .eq('user_id', userId);
      return null;
    }

    return rateLimit;
  } catch (err) {
    console.error('Error getting rate limit:', err);
    return null;
  }
}

/**
 * Increment the rate limit counter for a user
 * Creates new record if none exists, or increments existing
 * Resets at midnight KST (Korea Standard Time)
 * @returns Success status with rate limit info
 */
export async function incrementRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; rateLimit?: SubmissionRateLimit; error?: string }> {
  try {
    const now = new Date();

    // Calculate next midnight KST (UTC+9)
    // Create date in KST timezone
    const kstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const kstTomorrow = new Date(kstNow);
    kstTomorrow.setDate(kstTomorrow.getDate() + 1);
    kstTomorrow.setHours(0, 0, 0, 0);

    // Convert back to UTC for storage
    const resetAt = new Date(kstTomorrow.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    resetAt.setMinutes(resetAt.getMinutes() - resetAt.getTimezoneOffset());

    // Check existing rate limit
    const existing = await getRateLimit(supabase, userId);

    if (!existing) {
      // First submission today - create new record
      const { data, error } = await supabase
        .from('submission_rate_limits')
        .insert({
          user_id: userId,
          submission_count: 1,
          reset_at: resetAt.toISOString(),
          last_submission_at: now.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating rate limit:', error);
        return { success: false, error: error.message };
      }

      return { success: true, rateLimit: transformSubmissionRateLimit(data) };
    }

    // Check if limit reached
    if (existing.submissionCount >= 3) {
      return {
        success: false,
        error: 'Daily submission limit reached (3 submissions per day)',
        rateLimit: existing,
      };
    }

    // Increment existing counter
    const { data, error } = await supabase
      .from('submission_rate_limits')
      .update({
        submission_count: existing.submissionCount + 1,
        last_submission_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error incrementing rate limit:', error);
      return { success: false, error: error.message };
    }

    return { success: true, rateLimit: transformSubmissionRateLimit(data) };
  } catch (err) {
    console.error('Unexpected error incrementing rate limit:', err);
    return { success: false, error: 'Failed to check rate limit' };
  }
}

/**
 * Reset rate limit for a user (admin use)
 * @returns Success boolean
 */
export async function resetRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('submission_rate_limits')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting rate limit:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error resetting rate limit:', err);
    return { success: false, error: 'Failed to reset rate limit' };
  }
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get submission statistics for a user
 * @returns Statistics object with counts
 */
export async function getSubmissionStatistics(
  supabase: SupabaseClient,
  userId: string
): Promise<SubmissionStatistics> {
  try {
    const { data, error } = await supabase
      .from('cafe_submissions')
      .select('status')
      .eq('user_id', userId);

    if (error || !data) {
      console.error('Error fetching submission statistics:', error);
      return { total: 0, pending: 0, approved: 0, declined: 0 };
    }

    const stats = data.reduce(
      (acc, row) => {
        acc.total++;
        acc[row.status as SubmissionStatus]++;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, declined: 0 }
    );

    return stats;
  } catch (err) {
    console.error('Unexpected error fetching statistics:', err);
    return { total: 0, pending: 0, approved: 0, declined: 0 };
  }
}
