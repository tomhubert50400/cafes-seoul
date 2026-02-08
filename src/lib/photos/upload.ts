/**
 * Photo upload utilities for Supabase Storage
 * Handles file uploads to storage and database record insertion
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface UploadResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface LimitCheckResult {
  canUpload: boolean;
  reason?: string;
  remainingDaily?: number;
  remainingCafe?: number;
}

export interface StorageUploadResult {
  path: string;
  error?: string;
}

// ============================================
// STORAGE UPLOAD
// ============================================

/**
 * Upload a photo file to Supabase Storage
 * Generates unique path: photos/{cafeId}/{userId}/{timestamp}-{random}.ext
 * @param supabase - Supabase client instance
 * @param file - File to upload
 * @param cafeId - UUID of the cafe
 * @param userId - UUID of the uploading user
 * @returns UploadResult with path or error
 */
export async function uploadPhotoToStorage(
  supabase: SupabaseClient,
  file: File,
  cafeId: string,
  userId: string
): Promise<StorageUploadResult> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${timestamp}-${random}.${extension}`;

    // Build storage path (user-photos subfolder in cafe-images bucket)
    const path = `user-photos/${cafeId}/${userId}/${filename}`;

    // Upload to Supabase Storage (using existing cafe-images bucket)
    const { error: uploadError } = await supabase.storage
      .from('cafe-images')
      .upload(path, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return {
        path: '',
        error: uploadError.message || 'Failed to upload photo to storage',
      };
    }

    return { path };
  } catch (err) {
    console.error('Unexpected error uploading photo:', err);
    return {
      path: '',
      error: err instanceof Error ? err.message : 'Failed to upload photo',
    };
  }
}

/**
 * Get public URL for a photo in storage
 * @param supabase - Supabase client instance
 * @param path - Storage path of the photo
 * @returns Public URL string
 */
export function getPhotoPublicUrl(
  supabase: SupabaseClient,
  path: string
): string {
  const { data } = supabase.storage.from('cafe-images').getPublicUrl(path);
  return data.publicUrl;
}

// ============================================
// ADMIN CHECK
// ============================================

async function isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile?.role === 'admin';
}

// ============================================
// LIMIT CHECKS
// ============================================

/**
 * Check if user can upload photos (daily rate limit)
 * Uses can_upload_photo() RPC function
 * @param supabase - Supabase client instance
 * @param userId - UUID of the user
 * @returns LimitCheckResult with canUpload flag and remaining count
 */
export async function checkDailyLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<LimitCheckResult> {
  try {
    // Check if user can upload using RPC
    const { data: canUpload, error: rpcError } = await supabase.rpc(
      'can_upload_photo',
      { user_uuid: userId }
    );

    if (rpcError) {
      console.error('Error checking daily limit:', rpcError);
      return {
        canUpload: false,
        reason: 'Unable to check upload limit. Please try again.',
      };
    }

    // Get remaining uploads
    const { data: remaining, error: remainingError } = await supabase.rpc(
      'get_remaining_uploads',
      { user_uuid: userId }
    );

    if (remainingError) {
      console.error('Error getting remaining uploads:', remainingError);
    }

    const remainingDaily = remaining ?? 0;

    if (!canUpload) {
      return {
        canUpload: false,
        reason: `Daily upload limit reached. You have ${remainingDaily} uploads remaining today.`,
        remainingDaily,
      };
    }

    return {
      canUpload: true,
      remainingDaily,
    };
  } catch (err) {
    console.error('Unexpected error checking daily limit:', err);
    return {
      canUpload: false,
      reason: 'Failed to check upload limits. Please try again.',
    };
  }
}

/**
 * Check if user can upload to a specific cafe (3 photo per cafe limit)
 * Uses can_upload_to_cafe() RPC function
 * @param supabase - Supabase client instance
 * @param userId - UUID of the user
 * @param cafeId - UUID of the cafe
 * @returns LimitCheckResult with canUpload flag and remaining count
 */
export async function checkPhotoLimits(
  supabase: SupabaseClient,
  userId: string,
  cafeId: string
): Promise<LimitCheckResult> {
  try {
    // Check if user can upload to this cafe using RPC
    const { data: canUpload, error: rpcError } = await supabase.rpc(
      'can_upload_to_cafe',
      { user_uuid: userId, cafe_uuid: cafeId }
    );

    if (rpcError) {
      console.error('Error checking cafe photo limit:', rpcError);
      return {
        canUpload: false,
        reason: 'Unable to check photo limits for this cafe. Please try again.',
      };
    }

    // Get current count of photos for this user at this cafe
    const { data: photoCount, error: countError } = await supabase.rpc(
      'count_user_cafe_photos',
      { user_uuid: userId, cafe_uuid: cafeId }
    );

    if (countError) {
      console.error('Error counting user cafe photos:', countError);
    }

    const currentCount = photoCount ?? 0;
    const remainingCafe = Math.max(0, 3 - currentCount);

    if (!canUpload) {
      return {
        canUpload: false,
        reason: `You have reached the limit of 3 photos for this cafe.`,
        remainingCafe: 0,
      };
    }

    return {
      canUpload: true,
      remainingCafe,
    };
  } catch (err) {
    console.error('Unexpected error checking photo limits:', err);
    return {
      canUpload: false,
      reason: 'Failed to check photo limits. Please try again.',
    };
  }
}

/**
 * Check all upload limits at once (daily + per cafe)
 * @param supabase - Supabase client instance
 * @param userId - UUID of the user
 * @param cafeId - UUID of the cafe
 * @returns Combined limit check result
 */
export async function checkAllUploadLimits(
  supabase: SupabaseClient,
  userId: string,
  cafeId: string
): Promise<LimitCheckResult> {
  // Check daily limit first
  const dailyCheck = await checkDailyLimit(supabase, userId);

  if (!dailyCheck.canUpload) {
    return dailyCheck;
  }

  // Check cafe limit
  const cafeCheck = await checkPhotoLimits(supabase, userId, cafeId);

  if (!cafeCheck.canUpload) {
    return cafeCheck;
  }

  // Both limits allow upload
  return {
    canUpload: true,
    remainingDaily: dailyCheck.remainingDaily,
    remainingCafe: cafeCheck.remainingCafe,
  };
}

// ============================================
// DATABASE OPERATIONS
// ============================================

export interface PhotoInsertData {
  cafeId: string;
  userId: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Insert photo record into database
 * Creates pending photo entry after successful storage upload
 * @param supabase - Supabase client instance
 * @param data - Photo data to insert
 * @returns Success flag and error message if failed
 */
export async function insertPhotoRecord(
  supabase: SupabaseClient,
  data: PhotoInsertData
): Promise<{ success: boolean; photoId?: string; error?: string }> {
  try {
    const { data: result, error } = await supabase
      .from('photos')
      .insert({
        cafe_id: data.cafeId,
        user_id: data.userId,
        storage_path: data.storagePath,
        file_size: data.fileSize,
        mime_type: data.mimeType,
        status: 'pending',
        upvote_count: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting photo record:', error);
      return {
        success: false,
        error: error.message || 'Failed to save photo information',
      };
    }

    return {
      success: true,
      photoId: result.id,
    };
  } catch (err) {
    console.error('Unexpected error inserting photo:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save photo',
    };
  }
}

// ============================================
// PROGRESS TRACKING
// ============================================

export type ProgressCallback = (progress: number) => void;

/**
 * Upload photo with progress tracking
 * Note: Supabase Storage doesn't natively support progress callbacks
 * This is a wrapper that simulates progress for UI feedback
 * For true progress, consider using XMLHttpRequest or @supabase/storage-js upload with onProgress
 * @param supabase - Supabase client instance
 * @param file - File to upload
 * @param cafeId - UUID of the cafe
 * @param userId - UUID of the uploading user
 * @param onProgress - Callback for progress updates (0-100)
 * @returns UploadResult with path or error
 */
export async function uploadPhotoWithProgress(
  supabase: SupabaseClient,
  file: File,
  cafeId: string,
  userId: string,
  onProgress?: ProgressCallback
): Promise<StorageUploadResult> {
  // Simulate progress since Supabase Storage doesn't provide native progress
  // In production, you might want to use a custom upload method with XMLHttpRequest
  let progressInterval: NodeJS.Timeout | null = null;

  try {
    // Start progress simulation
    if (onProgress) {
      let progress = 0;
      onProgress(progress);

      progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90; // Hold at 90% until complete
        onProgress(Math.min(progress, 90));
      }, 200);
    }

    // Perform actual upload
    const result = await uploadPhotoToStorage(supabase, file, cafeId, userId);

    // Clear interval and set to 100%
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    if (onProgress) {
      onProgress(result.error ? 0 : 100);
    }

    return result;
  } catch (err) {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    if (onProgress) {
      onProgress(0);
    }

    return {
      path: '',
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}
