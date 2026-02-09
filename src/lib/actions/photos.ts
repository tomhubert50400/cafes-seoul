'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { MAX_FILE_SIZE, ALLOWED_TYPES } from '@/lib/photos/validation';
import type { PhotoStatus, PhotoWithVoteStatus } from '@/types/photos';

// ============================================
// TYPES
// ============================================

export interface UploadPhotoResult {
  success: boolean;
  photoId?: string;
  error?: string;
}

export interface DeletePhotoResult {
  success: boolean;
  error?: string;
}

export interface LimitCheckResult {
  canUpload: boolean;
  remainingCafe: number;
  remainingDaily: number;
}

export interface PhotoUploadInput {
  file: File;
  cafeId: string;
}

// ============================================
// UPLOAD PHOTO
// ============================================

/**
 * Upload a photo to a cafe
 * Enforces both limits: 3 photos per cafe and 10 uploads per day
 * @param formData - FormData with 'file' and 'cafeId'
 * @returns Success status with photo ID or error
 */
export async function uploadPhoto(formData: FormData): Promise<UploadPhotoResult> {
  try {
    // 1. Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Extract and validate form data
    const file = formData.get('file') as File | null;
    const cafeId = formData.get('cafeId') as string | null;

    if (!file || !cafeId) {
      return { success: false, error: 'Missing file or cafeId' };
    }

    // 3. Validate file type
    if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
      return { 
        success: false, 
        error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed' 
      };
    }

    // 4. Validate file size (15MB max)
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File must be less than 15MB' };
    }

    // 5. Check rate limits (skip for admins)
    const userIsAdmin = await isAdmin(supabase, user.id);

    if (!userIsAdmin) {
      // Check 3 photo per cafe limit using RPC
      const { data: canUploadCafe, error: cafeLimitError } = await supabase.rpc(
        'can_upload_to_cafe',
        { user_uuid: user.id, cafe_uuid: cafeId }
      );

      if (cafeLimitError) {
        console.error('Error checking cafe photo limit:', cafeLimitError);
        return { success: false, error: 'Failed to check photo limits' };
      }

      if (!canUploadCafe) {
        return {
          success: false,
          error: 'Photo limit reached: You can upload up to 3 photos per cafe'
        };
      }

      // Check 10 per day rate limit using RPC
      const { data: canUploadDaily, error: dailyLimitError } = await supabase.rpc(
        'can_upload_photo',
        { user_uuid: user.id }
      );

      if (dailyLimitError) {
        console.error('Error checking daily upload limit:', dailyLimitError);
        return { success: false, error: 'Failed to check daily upload limits' };
      }

      if (!canUploadDaily) {
        return {
          success: false,
          error: 'Daily upload limit reached: You can upload up to 10 photos per day'
        };
      }
    }

    // 6. Generate unique storage path
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueId = crypto.randomUUID();
    const storagePath = `${cafeId}/${user.id}/${uniqueId}.${fileExt}`;

    // 8. Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      return { success: false, error: 'Failed to upload photo to storage' };
    }

    // 7. Insert record to photos table (auto-approved for admins)
    const photoStatus = userIsAdmin ? 'approved' : 'pending';
    const insertData: Record<string, unknown> = {
      user_id: user.id,
      cafe_id: cafeId,
      storage_path: storagePath,
      status: photoStatus,
      file_size: file.size,
      mime_type: file.type,
    };
    if (userIsAdmin) {
      insertData.approved_at = new Date().toISOString();
      insertData.approved_by = user.id;
    }
    const { data: photo, error: insertError } = await supabase
      .from('photos')
      .insert(insertData)
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting photo record:', insertError);
      
      // Try to clean up the uploaded file
      await supabase.storage.from('cafe-images').remove([storagePath]);
      
      return { success: false, error: 'Failed to create photo record' };
    }

    // 10. Revalidate the cafe detail page to show new photo
    const { data: cafe } = await supabase
      .from('cafes')
      .select('slug')
      .eq('id', cafeId)
      .single();

    if (cafe?.slug) {
      revalidatePath(`/cafes/${cafe.slug}`);
    }

    return { success: true, photoId: photo.id };
  } catch (err) {
    console.error('Unexpected error uploading photo:', err);
    return { success: false, error: 'Failed to upload photo' };
  }
}

// ============================================
// DELETE PHOTO
// ============================================

/**
 * Helper to verify if user is admin
 */
async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile?.role === 'admin';
}

/**
 * Delete a photo
 * - Regular users can only delete their own pending photos
 * - Admins can delete any photo (including approved ones)
 * @param photoId - ID of the photo to delete
 * @returns Success status or error
 */
export async function deletePhoto(photoId: string): Promise<DeletePhotoResult> {
  try {
    // 1. Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Check if user is admin
    const userIsAdmin = await isAdmin(supabase, user.id);

    // 3. Fetch the photo to verify ownership and status
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('user_id, status, storage_path, cafe_id')
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) {
      return { success: false, error: 'Photo not found' };
    }

    // 4. Check permissions
    if (!userIsAdmin) {
      // Regular users can only delete their own pending photos
      if (photo.user_id !== user.id) {
        return { success: false, error: 'You can only delete your own photos' };
      }

      if (photo.status !== 'pending') {
        return { 
          success: false, 
          error: 'Only pending photos can be deleted. Approved photos are permanent.' 
        };
      }
    }
    // Admins can delete any photo regardless of ownership or status

    // 5. Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([photo.storage_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue to try database deletion even if storage fails
    }

    // 6. Delete record from photos table (cascades to votes via foreign key)
    // Use .select() to verify deletion actually occurred (RLS may silently block)
    let deleteQuery = supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    // Only add user_id filter for non-admins
    if (!userIsAdmin) {
      deleteQuery = deleteQuery.eq('user_id', user.id);
    }

    // Select the deleted row to confirm deletion happened
    const { data: deletedRows, error: deleteError } = await deleteQuery.select('id');

    if (deleteError) {
      console.error('Error deleting photo record:', deleteError);
      return { success: false, error: 'Failed to delete photo' };
    }

    // If no rows were deleted, RLS blocked the operation
    if (!deletedRows || deletedRows.length === 0) {
      console.error('Delete blocked by RLS - no rows deleted for photoId:', photoId);
      return { success: false, error: 'Permission denied: Unable to delete photo' };
    }

    // 7. Revalidate the cafe detail page
    const { data: cafe } = await supabase
      .from('cafes')
      .select('slug')
      .eq('id', photo.cafe_id)
      .single();

    if (cafe?.slug) {
      revalidatePath(`/cafes/${cafe.slug}`);
    }

    // Also revalidate admin photos page
    revalidatePath('/admin/photos');

    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting photo:', err);
    return { success: false, error: 'Failed to delete photo' };
  }
}

// ============================================
// CHECK PHOTO LIMITS
// ============================================

/**
 * Check remaining photo upload limits for a user at a specific cafe
 * Returns counts for both per-cafe and daily limits
 * @param cafeId - ID of the cafe being uploaded to
 * @returns Limit check result with remaining counts
 */
export async function checkPhotoLimits(cafeId: string): Promise<LimitCheckResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { canUpload: false, remainingCafe: 0, remainingDaily: 0 };
    }

    // Admins have no limits
    const userIsAdmin = await isAdmin(supabase, user.id);
    if (userIsAdmin) {
      return { canUpload: true, remainingCafe: 999, remainingDaily: 999 };
    }

    // Get remaining daily uploads
    const { data: remainingDaily, error: dailyError } = await supabase.rpc(
      'get_remaining_uploads',
      { user_uuid: user.id }
    );

    if (dailyError) {
      console.error('Error getting remaining uploads:', dailyError);
    }

    // Get current photo count for this cafe (excluding rejected)
    const { data: cafePhotoCount, error: cafeError } = await supabase.rpc(
      'count_user_cafe_photos',
      { user_uuid: user.id, cafe_uuid: cafeId }
    );

    if (cafeError) {
      console.error('Error counting cafe photos:', cafeError);
    }

    const remainingCafe = Math.max(0, 3 - (cafePhotoCount || 0));
    const remainingDailyCount = remainingDaily ?? 0;

    return {
      canUpload: remainingCafe > 0 && remainingDailyCount > 0,
      remainingCafe,
      remainingDaily: remainingDailyCount,
    };
  } catch (err) {
    console.error('Unexpected error checking photo limits:', err);
    return { canUpload: false, remainingCafe: 0, remainingDaily: 0 };
  }
}

// ============================================
// TOGGLE PHOTO VOTE
// ============================================

/**
 * Toggle upvote on a photo
 * If user has voted, removes the vote. If not, adds a vote.
 * @param photoId - ID of the photo to vote on
 * @returns Success status with new vote state or error
 */
export async function togglePhotoVote(photoId: string): Promise<{
  success: boolean;
  hasVoted?: boolean;
  upvoteCount?: number;
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

    // 2. Check if user already voted for this photo
    const { data: existingVote, error: checkError } = await supabase
      .from('photo_votes')
      .select('id')
      .eq('user_id', user.id)
      .eq('photo_id', photoId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing vote:', checkError);
      return { success: false, error: 'Failed to check vote status' };
    }

    // 3. Toggle vote
    if (existingVote) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from('photo_votes')
        .delete()
        .eq('id', existingVote.id);

      if (deleteError) {
        console.error('Error removing vote:', deleteError);
        return { success: false, error: 'Failed to remove vote' };
      }

      // Get updated upvote count
      const { data: photo } = await supabase
        .from('photos')
        .select('upvote_count')
        .eq('id', photoId)
        .single();

      return { success: true, hasVoted: false, upvoteCount: photo?.upvote_count || 0 };
    } else {
      // Add vote
      const { error: insertError } = await supabase
        .from('photo_votes')
        .insert({
          user_id: user.id,
          photo_id: photoId,
        });

      if (insertError) {
        console.error('Error adding vote:', insertError);
        return { success: false, error: 'Failed to add vote' };
      }

      // Get updated upvote count
      const { data: photo } = await supabase
        .from('photos')
        .select('upvote_count')
        .eq('id', photoId)
        .single();

      return { success: true, hasVoted: true, upvoteCount: photo?.upvote_count || 0 };
    }
  } catch (err) {
    console.error('Unexpected error toggling vote:', err);
    return { success: false, error: 'Failed to toggle vote' };
  }
}

// ============================================
// GET PHOTOS FOR CAFE
// ============================================

/**
 * Get photos for a cafe with current user's vote status
 * Includes pending photos only for the uploader
 * Sorted by upvote count descending
 * @param cafeId - ID of the cafe
 * @param options - Pagination options
 * @returns Success status with photos array or error
 */
export async function getCafePhotos(
  cafeId: string,
  options?: { offset?: number; limit?: number }
): Promise<{
  success: boolean;
  photos?: PhotoWithVoteStatus[];
  total?: number;
  hasMore?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const offset = options?.offset ?? 0;
    const limit = Math.min(options?.limit ?? 6, 20); // Max 20 per request

    // Build base query for approved photos
    // Also include user's own pending/rejected photos
    let query = supabase
      .from('photos')
      .select(
        `
        id,
        cafe_id,
        user_id,
        storage_path,
        file_size,
        mime_type,
        status,
        upvote_count,
        rejection_reason,
        created_at,
        updated_at
      `,
        { count: 'exact' }
      )
      .eq('cafe_id', cafeId);

    // Apply visibility filter:
    // - Approved photos visible to all
    // - User's own photos (any status) visible to them
    if (user) {
      query = query.or(
        `status.eq.approved,and(user_id.eq.${user.id})`
      );
    } else {
      query = query.eq('status', 'approved');
    }

    // Sort by upvote count descending, then by creation date
    query = query
      .order('upvote_count', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: photos, error, count } = await query;

    if (error) {
      console.error('Error fetching photos:', error);
      return { success: false, error: 'Failed to fetch photos' };
    }

    // Get user's votes for these photos (if authenticated)
    let userVotes: Set<string> = new Set();
    if (user && photos && photos.length > 0) {
      const photoIds = photos.map((p) => p.id);
      const { data: votes } = await supabase
        .from('photo_votes')
        .select('photo_id')
        .eq('user_id', user.id)
        .in('photo_id', photoIds);

      userVotes = new Set(votes?.map((v) => v.photo_id) || []);
    }

    // Transform to PhotoWithVoteStatus
    const transformedPhotos: PhotoWithVoteStatus[] = (photos || []).map((photo) => ({
      id: photo.id,
      storage_path: photo.storage_path,
      status: photo.status as PhotoStatus,
      upvote_count: photo.upvote_count,
      upvoteCount: photo.upvote_count,
      created_at: photo.created_at,
      url: supabase.storage.from('cafe-images').getPublicUrl(photo.storage_path).data.publicUrl,
      hasVoted: userVotes.has(photo.id),
      isOwnPhoto: user ? photo.user_id === user.id : false,
    }));

    return {
      success: true,
      photos: transformedPhotos,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (err) {
    console.error('Unexpected error fetching photos:', err);
    return { success: false, error: 'Failed to fetch photos' };
  }
}

// ============================================
// GET USER PHOTOS
// ============================================

/**
 * Get all photos uploaded by the current user
 * Used in user dashboard to show user's photo contributions
 * @param options - Pagination options
 * @returns Success status with photos array or error
 */
export async function getMyPhotos(options?: {
  offset?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  photos?: PhotoWithVoteStatus[];
  total?: number;
  hasMore?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const offset = options?.offset ?? 0;
    const limit = Math.min(options?.limit ?? 12, 50);

    // Get user's photos with cafe info
    const { data: photos, error, count } = await supabase
      .from('photos')
      .select(
        `
        id,
        cafe_id,
        user_id,
        storage_path,
        file_size,
        mime_type,
        status,
        upvote_count,
        rejection_reason,
        created_at,
        updated_at,
        cafe:cafes(id, name, slug)
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching user photos:', error);
      return { success: false, error: 'Failed to fetch photos' };
    }

    // Get user's votes for these photos
    const photoIds = photos?.map((p) => p.id) || [];
    const { data: votes } = await supabase
      .from('photo_votes')
      .select('photo_id')
      .eq('user_id', user.id)
      .in('photo_id', photoIds);

    const userVotes = new Set(votes?.map((v) => v.photo_id) || []);

    // Transform to PhotoWithVoteStatus
    const transformedPhotos: PhotoWithVoteStatus[] = (photos || []).map((photo) => ({
      id: photo.id,
      storage_path: photo.storage_path,
      status: photo.status as PhotoStatus,
      upvote_count: photo.upvote_count,
      upvoteCount: photo.upvote_count,
      created_at: photo.created_at,
      url: supabase.storage.from('cafe-images').getPublicUrl(photo.storage_path).data.publicUrl,
      hasVoted: userVotes.has(photo.id),
      isOwnPhoto: true, // These are always the user's own photos
    }));

    return {
      success: true,
      photos: transformedPhotos,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (err) {
    console.error('Unexpected error fetching user photos:', err);
    return { success: false, error: 'Failed to fetch photos' };
  }
}

// ============================================
// GET PHOTO UPLOAD STATUS
// ============================================

/**
 * Get detailed upload limit status for the current user
 * @returns Upload status with limits and current usage
 */
export async function getPhotoUploadStatus(): Promise<{
  success: boolean;
  status?: {
    dailyLimit: number;
    dailyUsed: number;
    dailyRemaining: number;
    resetAt: string;
    lastUploadAt: string | null;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Admins have no limits
    const userIsAdmin = await isAdmin(supabase, user.id);
    if (userIsAdmin) {
      return {
        success: true,
        status: {
          dailyLimit: Infinity,
          dailyUsed: 0,
          dailyRemaining: Infinity,
          resetAt: new Date().toISOString(),
          lastUploadAt: null,
        },
      };
    }

    // Get rate limit record
    const { data: limitRecord, error } = await supabase
      .from('photo_upload_limits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (which means full quota available)
      console.error('Error fetching upload status:', error);
      return { success: false, error: 'Failed to fetch upload status' };
    }

    // Calculate remaining
    const dailyUsed = limitRecord?.upload_count || 0;
    const dailyRemaining = Math.max(0, 10 - dailyUsed);

    return {
      success: true,
      status: {
        dailyLimit: 10,
        dailyUsed,
        dailyRemaining,
        resetAt: limitRecord?.reset_at || new Date().toISOString(),
        lastUploadAt: limitRecord?.last_upload_at || null,
      },
    };
  } catch (err) {
    console.error('Unexpected error fetching upload status:', err);
    return { success: false, error: 'Failed to fetch upload status' };
  }
}
