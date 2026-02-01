'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { SubmissionWithUser } from '@/types/submission';
import type { SupabaseClient } from '@supabase/supabase-js';
import { geocodeAddress } from '@/lib/kakao/geocode';

// ============================================
// HELPER: Verify admin role
// ============================================

async function verifyAdminRole(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile?.role === 'admin';
}

// ============================================
// HELPER: Generate slug from name
// ============================================

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\uAC00-\uD7A3]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36)
  );
}

// ============================================
// APPROVE SUBMISSION
// ============================================

const approveSchema = z.object({
  submissionId: z.string().uuid(),
  adminNotes: z.string().optional(),
});

export async function approveSubmission(input: z.infer<typeof approveSchema>): Promise<{
  success: boolean;
  cafeId?: string;
  error?: string;
}> {
  // 1. Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  // 2. Verify admin role from database
  if (!(await verifyAdminRole(supabase, user.id))) {
    return { success: false, error: 'Unauthorized - admin role required' };
  }

  // 3. Validate input
  const validation = approveSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues.map((i) => i.message).join(', ') };
  }

  // 4. Fetch submission
  const { data: submission, error: fetchError } = await supabase
    .from('cafe_submissions')
    .select('*')
    .eq('id', validation.data.submissionId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !submission) {
    return { success: false, error: 'Submission not found or already processed' };
  }

  // 5. Get coordinates - use submission data or geocode from address
  let latitude = submission.latitude;
  let longitude = submission.longitude;

  if (latitude == null || longitude == null) {
    // Try to geocode from Korean address first, then English
    const addressToGeocode = submission.address?.ko || submission.address?.en;
    if (addressToGeocode) {
      const geocoded = await geocodeAddress(addressToGeocode);
      if (geocoded) {
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
      }
    }
  }

  // 6. Create cafe from submission data using raw SQL to handle PostGIS geometry
  const slug = generateSlug(submission.name.en || submission.name.ko || 'cafe');
  const { data: cafeResult, error: cafeError } = await supabase.rpc('create_cafe_from_submission', {
    p_name: submission.name,
    p_address: submission.address,
    p_phone: submission.phone,
    p_latitude: latitude,
    p_longitude: longitude,
    p_district_id: submission.district_id,
    p_neighborhood_id: submission.neighborhood_id,
    p_slug: slug,
    p_kakao_place_id: submission.kakao_place_id || null,
  });

  if (cafeError || !cafeResult) {
    console.error('Error creating cafe:', cafeError);
    return { success: false, error: 'Failed to create cafe' };
  }

  const cafe = { id: cafeResult };

  // 7. Update submission status
  const { error: updateError } = await supabase
    .from('cafe_submissions')
    .update({
      status: 'approved',
      admin_notes: validation.data.adminNotes || null,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      cafe_id: cafe.id,
    })
    .eq('id', validation.data.submissionId);

  if (updateError) {
    console.error('Error updating submission:', updateError);
    return { success: false, error: 'Failed to update submission status' };
  }

  // 8. Revalidate paths
  revalidatePath('/admin/submissions');
  revalidatePath('/admin');
  revalidatePath('/cafes');

  return { success: true, cafeId: cafe.id };
}

// ============================================
// REJECT SUBMISSION
// ============================================

const rejectSchema = z.object({
  submissionId: z.string().uuid(),
  rejectionReason: z.string().min(10, 'Reason must be at least 10 characters'),
  adminNotes: z.string().optional(),
});

export async function rejectSubmission(input: z.infer<typeof rejectSchema>): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  // 2. Verify admin role from database
  if (!(await verifyAdminRole(supabase, user.id))) {
    return { success: false, error: 'Unauthorized - admin role required' };
  }

  // 3. Validate input
  const validation = rejectSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues.map((i) => i.message).join(', ') };
  }

  // 4. Fetch submission to verify it exists and is pending
  const { data: submission, error: fetchError } = await supabase
    .from('cafe_submissions')
    .select('id')
    .eq('id', validation.data.submissionId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !submission) {
    return { success: false, error: 'Submission not found or already processed' };
  }

  // 5. Update submission status to declined
  const { error: updateError } = await supabase
    .from('cafe_submissions')
    .update({
      status: 'declined',
      rejection_reason: validation.data.rejectionReason,
      admin_notes: validation.data.adminNotes || null,
    })
    .eq('id', validation.data.submissionId);

  if (updateError) {
    console.error('Error rejecting submission:', updateError);
    return { success: false, error: 'Failed to reject submission' };
  }

  // 6. Revalidate paths
  revalidatePath('/admin/submissions');
  revalidatePath('/admin');

  return { success: true };
}

// ============================================
// EDIT SUBMISSION (before approving)
// ============================================

const editSchema = z.object({
  submissionId: z.string().uuid(),
  name: z.record(z.string(), z.string()),
  address: z.record(z.string(), z.string()),
  phone: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export async function editSubmission(input: z.infer<typeof editSchema>): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  // 2. Verify admin role from database
  if (!(await verifyAdminRole(supabase, user.id))) {
    return { success: false, error: 'Unauthorized - admin role required' };
  }

  // 3. Validate input
  const validation = editSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues.map((i) => i.message).join(', ') };
  }

  // 4. Fetch submission to verify it exists and is pending
  const { data: submission, error: fetchError } = await supabase
    .from('cafe_submissions')
    .select('id')
    .eq('id', validation.data.submissionId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !submission) {
    return { success: false, error: 'Submission not found or already processed' };
  }

  // 5. Update submission content (not status)
  const updateData: Record<string, unknown> = {
    name: validation.data.name,
    address: validation.data.address,
    updated_at: new Date().toISOString(),
  };

  if (validation.data.phone !== undefined) {
    updateData.phone = validation.data.phone;
  }
  if (validation.data.latitude !== undefined) {
    updateData.latitude = validation.data.latitude;
  }
  if (validation.data.longitude !== undefined) {
    updateData.longitude = validation.data.longitude;
  }

  const { error: updateError } = await supabase
    .from('cafe_submissions')
    .update(updateData)
    .eq('id', validation.data.submissionId);

  if (updateError) {
    console.error('Error editing submission:', updateError);
    return { success: false, error: 'Failed to update submission' };
  }

  // 6. Revalidate paths
  revalidatePath('/admin/submissions');

  return { success: true };
}

// ============================================
// PHOTO MODERATION ACTIONS
// ============================================

const approvePhotoSchema = z.object({
  photoId: z.string().uuid('Invalid photo ID'),
});

/**
 * Approve a pending photo
 * Updates status to 'approved', sets approved_at and approved_by
 * @param photoId - ID of the photo to approve
 * @returns Success status or error
 */
export async function approvePhoto(photoId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Verify authentication and admin role
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    if (!(await verifyAdminRole(supabase, user.id))) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // 2. Validate input
    const validation = approvePhotoSchema.safeParse({ photoId });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    // 3. Get current photo to verify it is pending
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('id, status, cafe_id')
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) {
      return { success: false, error: 'Photo not found' };
    }

    if (photo.status !== 'pending') {
      return { success: false, error: 'Only pending photos can be approved' };
    }

    // 4. Update photo status to approved
    const { error: updateError } = await supabase
      .from('photos')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', photoId)
      .eq('status', 'pending');

    if (updateError) {
      console.error('Error approving photo:', updateError);
      return { success: false, error: 'Failed to approve photo' };
    }

    // 5. Revalidate paths
    revalidatePath('/admin/photos');
    revalidatePath('/admin');

    if (photo.cafe_id) {
      const { data: cafe } = await supabase
        .from('cafes')
        .select('slug')
        .eq('id', photo.cafe_id)
        .single();

      if (cafe?.slug) {
        revalidatePath(`/cafes/${cafe.slug}`);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error approving photo:', err);
    return { success: false, error: 'Failed to approve photo' };
  }
}

const rejectPhotoSchema = z.object({
  photoId: z.string().uuid('Invalid photo ID'),
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters'),
});

/**
 * Reject a pending photo with a reason
 * Updates status to 'rejected', sets rejection_reason
 * @param photoId - ID of the photo to reject
 * @param reason - Reason for rejection (visible to uploader)
 * @returns Success status or error
 */
export async function rejectPhoto(
  photoId: string,
  reason: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Verify authentication and admin role
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    if (!(await verifyAdminRole(supabase, user.id))) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // 2. Validate input
    const validation = rejectPhotoSchema.safeParse({ photoId, reason });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    // 3. Get current photo to verify it is pending
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('id, status, cafe_id')
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) {
      return { success: false, error: 'Photo not found' };
    }

    if (photo.status !== 'pending') {
      return { success: false, error: 'Only pending photos can be rejected' };
    }

    // 4. Update photo status to rejected
    const { error: updateError } = await supabase
      .from('photos')
      .update({
        status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', photoId)
      .eq('status', 'pending');

    if (updateError) {
      console.error('Error rejecting photo:', updateError);
      return { success: false, error: 'Failed to reject photo' };
    }

    // 5. Revalidate paths
    revalidatePath('/admin/photos');
    revalidatePath('/admin');

    return { success: true };
  } catch (err) {
    console.error('Unexpected error rejecting photo:', err);
    return { success: false, error: 'Failed to reject photo' };
  }
}

// ============================================
// GET PENDING PHOTOS FOR ADMIN
// ============================================

export interface PendingPhoto {
  id: string;
  storage_path: string;
  cafe_id: string;
  cafe_name: string | null;
  cafe_slug: string | null;
  user_id: string;
  created_at: string;
  file_size: number;
  mime_type: string;
}

/**
 * Get all pending photos for admin moderation
 * Includes cafe information for context
 * @returns List of pending photos with cafe info
 */
export async function getPendingPhotos(): Promise<{
  success: boolean;
  photos?: PendingPhoto[];
  error?: string;
}> {
  try {
    // 1. Verify authentication and admin role
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    if (!(await verifyAdminRole(supabase, user.id))) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // 2. Fetch pending photos with cafe info
    const { data: photos, error } = await supabase
      .from('photos')
      .select(`
        id,
        storage_path,
        cafe_id,
        user_id,
        created_at,
        file_size,
        mime_type,
        cafe:cafes(name, slug)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }); // Oldest first for FIFO moderation

    if (error) {
      console.error('Error fetching pending photos:', error);
      return { success: false, error: 'Failed to fetch pending photos' };
    }

    // Transform to flat structure
    const transformedPhotos: PendingPhoto[] = (photos || []).map((photo) => {
      // Supabase returns the joined data - handle both array and object cases
      const cafeData = photo.cafe as unknown;
      const cafe = Array.isArray(cafeData) ? cafeData[0] : cafeData;
      const typedCafe = cafe as { name: string; slug: string } | null;
      return {
        id: photo.id,
        storage_path: photo.storage_path,
        cafe_id: photo.cafe_id,
        cafe_name: typedCafe?.name || null,
        cafe_slug: typedCafe?.slug || null,
        user_id: photo.user_id,
        created_at: photo.created_at,
        file_size: photo.file_size,
        mime_type: photo.mime_type,
      };
    });

    return { success: true, photos: transformedPhotos };
  } catch (err) {
    console.error('Unexpected error fetching pending photos:', err);
    return { success: false, error: 'Failed to fetch pending photos' };
  }
}

// ============================================
// DELETE CAFE
// ============================================

const deleteCafeSchema = z.object({
  cafeId: z.string().uuid('Invalid cafe ID'),
});

/**
 * Delete an approved cafe permanently
 * This will cascade delete: photos, reviews, favorites, cafe_images
 * cafe_submissions and reports will have their cafe_id set to NULL
 * @param cafeId - ID of the cafe to delete
 * @returns Success status or error
 */
export async function deleteCafe(cafeId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Verify authentication and admin role
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    if (!(await verifyAdminRole(supabase, user.id))) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // 2. Validate input
    const validation = deleteCafeSchema.safeParse({ cafeId });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    // 3. Get cafe to verify it exists
    const { data: cafe, error: fetchError } = await supabase
      .from('cafes')
      .select('id, name, slug')
      .eq('id', cafeId)
      .single();

    if (fetchError || !cafe) {
      return { success: false, error: 'Cafe not found' };
    }

    // 4. Delete cafe (cascades to photos, reviews, favorites, cafe_images)
    const { error: deleteError } = await supabase
      .from('cafes')
      .delete()
      .eq('id', cafeId);

    if (deleteError) {
      console.error('Error deleting cafe:', deleteError);
      return { success: false, error: 'Failed to delete cafe' };
    }

    // 5. Revalidate paths
    revalidatePath('/admin/cafes');
    revalidatePath('/admin');
    revalidatePath('/cafes');
    revalidatePath(`/cafes/${cafe.slug}`);

    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting cafe:', err);
    return { success: false, error: 'Failed to delete cafe' };
  }
}

// ============================================
// GET APPROVED CAFES FOR ADMIN
// ============================================

export interface AdminCafe {
  id: string;
  name: Record<string, string>;
  slug: string;
  address: Record<string, string>;
  status: string;
  overallRating: number;
  totalRatings: number;
  createdAt: string;
}

/**
 * Get all approved/active cafes for admin management
 * @returns List of cafes with basic info for admin table
 */
export async function getApprovedCafes(options?: {
  offset?: number;
  limit?: number;
  search?: string;
}): Promise<{
  success: boolean;
  cafes?: AdminCafe[];
  total?: number;
  error?: string;
}> {
  try {
    // 1. Verify authentication and admin role
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    if (!(await verifyAdminRole(supabase, user.id))) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // 2. Build query
    const limit = options?.limit ?? 1000; // Default to 1000 for admin panel
    const offset = options?.offset || 0;

    // Get total count
    let countQuery = supabase
      .from('cafes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (options?.search) {
      countQuery = countQuery.or(`name->en.ilike.%${options.search}%,name->ko.ilike.%${options.search}%`);
    }

    const { count } = await countQuery;

    // Get cafes
    let cafesQuery = supabase
      .from('cafes')
      .select('id, name, slug, address, status, overall_rating, total_ratings, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.search) {
      cafesQuery = cafesQuery.or(`name->en.ilike.%${options.search}%,name->ko.ilike.%${options.search}%`);
    }

    const { data: cafes, error } = await cafesQuery;

    if (error) {
      console.error('Error fetching cafes:', error);
      return { success: false, error: 'Failed to fetch cafes' };
    }

    // Transform to AdminCafe type
    const transformedCafes: AdminCafe[] = (cafes || []).map((c) => ({
      id: c.id,
      name: c.name || {},
      slug: c.slug,
      address: c.address || {},
      status: c.status,
      overallRating: c.overall_rating || 0,
      totalRatings: c.total_ratings || 0,
      createdAt: c.created_at,
    }));

    return {
      success: true,
      cafes: transformedCafes,
      total: count || 0,
    };
  } catch (err) {
    console.error('Unexpected error fetching cafes:', err);
    return { success: false, error: 'Failed to fetch cafes' };
  }
}

// ============================================
// SEARCH CAFES (server-side search for admin)
// ============================================

/**
 * Search cafes by name or address (server-side)
 * @param query - Search query string
 * @returns Matching cafes
 */
export async function searchCafes(query: string): Promise<{
  success: boolean;
  cafes?: AdminCafe[];
  total?: number;
  error?: string;
}> {
  try {
    // 1. Verify authentication and admin role
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    if (!(await verifyAdminRole(supabase, user.id))) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // 2. Sanitize query for ILIKE
    const sanitizedQuery = query.trim().replace(/[%_]/g, '\\$&');
    if (!sanitizedQuery) {
      return { success: true, cafes: [], total: 0 };
    }

    // 3. Search cafes by name (en/ko) or address (en/ko)
    const { data: cafes, error, count } = await supabase
      .from('cafes')
      .select('id, name, slug, address, status, overall_rating, total_ratings, created_at', { count: 'exact' })
      .eq('status', 'active')
      .or(`name->>en.ilike.%${sanitizedQuery}%,name->>ko.ilike.%${sanitizedQuery}%,address->>en.ilike.%${sanitizedQuery}%,address->>ko.ilike.%${sanitizedQuery}%`)
      .order('name->>en', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error searching cafes:', error);
      return { success: false, error: 'Failed to search cafes' };
    }

    // Transform to AdminCafe type
    const transformedCafes: AdminCafe[] = (cafes || []).map((c) => ({
      id: c.id,
      name: c.name || {},
      slug: c.slug,
      address: c.address || {},
      status: c.status,
      overallRating: c.overall_rating || 0,
      totalRatings: c.total_ratings || 0,
      createdAt: c.created_at,
    }));

    return {
      success: true,
      cafes: transformedCafes,
      total: count || transformedCafes.length,
    };
  } catch (err) {
    console.error('Unexpected error searching cafes:', err);
    return { success: false, error: 'Failed to search cafes' };
  }
}

// ============================================
// GET PENDING SUBMISSIONS (for admin table)
// ============================================

export async function getPendingSubmissions(options?: {
  offset?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  submissions?: SubmissionWithUser[];
  total?: number;
  error?: string;
}> {
  // 1. Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  // 2. Verify admin role from database
  if (!(await verifyAdminRole(supabase, user.id))) {
    return { success: false, error: 'Unauthorized - admin role required' };
  }

  // 3. Build query
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  // Get total count
  const { count } = await supabase
    .from('cafe_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Get submissions with user info
  const { data: submissions, error } = await supabase
    .from('cafe_submissions')
    .select(
      `
      *,
      user:profiles!user_id(id, email, display_name, avatar_url, role)
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching pending submissions:', error);
    return { success: false, error: 'Failed to fetch submissions' };
  }

  // 4. Transform to SubmissionWithUser type
  const transformedSubmissions: SubmissionWithUser[] = (submissions || []).map((s) => ({
    id: s.id,
    userId: s.user_id,
    name: s.name,
    address: s.address,
    phone: s.phone,
    latitude: s.latitude,
    longitude: s.longitude,
    districtId: s.district_id,
    neighborhoodId: s.neighborhood_id,
    kakaoPlaceId: s.kakao_place_id,
    status: s.status,
    rejectionReason: s.rejection_reason,
    adminNotes: s.admin_notes,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    approvedAt: s.approved_at,
    approvedBy: s.approved_by,
    cafeId: s.cafe_id,
    user: {
      id: s.user?.id || '',
      email: s.user?.email || '',
      displayName: s.user?.display_name || null,
      avatarUrl: s.user?.avatar_url || null,
      role: s.user?.role,
    },
  }));

  return {
    success: true,
    submissions: transformedSubmissions,
    total: count || 0,
  };
}
