/**
 * Photo utility functions
 * Helpers for working with photos and Supabase Storage
 */

// ============================================
// STORAGE URL HELPERS
// ============================================

/**
 * Get the base Supabase URL from environment
 * @returns The Supabase project URL
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  }
  return url;
}

/**
 * Construct a full public URL for a photo in Supabase Storage
 * @param storagePath - The storage path (e.g., "cafes/uuid/filename.jpg")
 * @returns Full public URL for the photo
 * @example
 * getPhotoUrl("cafes/123/456/photo.jpg")
 * // Returns: "https://project.supabase.co/storage/v1/object/public/photos/cafes/123/456/photo.jpg"
 */
export function getPhotoUrl(storagePath: string): string {
  const supabaseUrl = getSupabaseUrl();
  // Remove leading slash if present
  const cleanPath = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
  return `${supabaseUrl}/storage/v1/object/public/photos/${cleanPath}`;
}

/**
 * Get a thumbnail URL for a photo
 * Uses Supabase Image Transformations for optimized thumbnails
 * @param storagePath - The storage path
 * @param width - Desired width (default 400)
 * @param height - Desired height (optional)
 * @returns Thumbnail URL with transformation parameters
 * @example
 * getPhotoThumbnailUrl("cafes/123/photo.jpg", 200)
 * // Returns resized image URL
 */
export function getPhotoThumbnailUrl(
  storagePath: string,
  width: number = 400,
  height?: number
): string {
  const supabaseUrl = getSupabaseUrl();
  const cleanPath = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
  
  // Build transformation query string
  const params = new URLSearchParams();
  params.set('width', width.toString());
  if (height) {
    params.set('height', height.toString());
  }
  params.set('resize', 'cover');
  params.set('quality', '80');
  
  return `${supabaseUrl}/storage/v1/render/image/public/photos/${cleanPath}?${params.toString()}`;
}

/**
 * Extract storage path from a full photo URL
 * Useful for reverse lookups
 * @param url - Full photo URL
 * @returns Storage path or null if not a valid photo URL
 * @example
 * extractStoragePath("https://project.supabase.co/storage/v1/object/public/photos/cafes/123/photo.jpg")
 * // Returns: "cafes/123/photo.jpg"
 */
export function extractStoragePath(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/photos\/(.+)$/);
  return match ? match[1] : null;
}

// ============================================
// PHOTO METADATA HELPERS
// ============================================

/**
 * Format photo upload date for display
 * @param dateString - ISO date string from database
 * @returns Formatted date string
 * @example
 * formatPhotoDate("2026-01-30T12:00:00Z")
 * // Returns: "Jan 30, 2026" (or localized equivalent)
 */
export function formatPhotoDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format vote count with compact notation for large numbers
 * @param count - Vote count
 * @returns Formatted string (e.g., "1.2K" for 1200)
 */
export function formatVoteCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

// ============================================
// PHOTO SORTING HELPERS
// ============================================

/**
 * Sort photos by upvote count (descending) and then by date
 * @param photos - Array of photos with upvote_count and created_at
 * @returns Sorted array
 */
export function sortPhotosByVotes<T extends { upvote_count: number; created_at: string }>(
  photos: T[]
): T[] {
  return [...photos].sort((a, b) => {
    // First sort by upvote count (descending)
    if (b.upvote_count !== a.upvote_count) {
      return b.upvote_count - a.upvote_count;
    }
    // Then by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Group photos by status
 * @param photos - Array of photos with status
 * @returns Object with grouped photos
 */
export function groupPhotosByStatus<T extends { status: string }>(
  photos: T[]
): { approved: T[]; pending: T[]; rejected: T[] } {
  return {
    approved: photos.filter((p) => p.status === 'approved'),
    pending: photos.filter((p) => p.status === 'pending'),
    rejected: photos.filter((p) => p.status === 'rejected'),
  };
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Check if a string is a valid photo storage path
 * @param path - Path to validate
 * @returns Boolean indicating if path looks valid
 */
export function isValidStoragePath(path: string): boolean {
  // Must not be empty
  if (!path || path.length === 0) return false;
  
  // Must contain at least one slash (cafe_id/filename pattern)
  if (!path.includes('/')) return false;
  
  // Must have a valid image extension
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const lowerPath = path.toLowerCase();
  return validExtensions.some((ext) => lowerPath.endsWith(ext));
}

/**
 * Generate a unique filename for photo upload
 * @param originalFilename - Original filename
 * @returns Unique filename with UUID prefix
 */
export function generateUniqueFilename(originalFilename: string): string {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const uuid = crypto.randomUUID();
  return `${uuid}.${ext}`;
}
