// ============================================
// PHOTO TYPES
// Phase 9: Photos & Voting
// ============================================

/**
 * Photo status enum values
 */
export type PhotoStatus = 'pending' | 'approved' | 'rejected';

/**
 * Base photo interface matching database schema (snake_case)
 */
export interface Photo {
  /** Unique photo identifier */
  id: string;
  /** Supabase Storage path (e.g., "cafes/uuid/filename.jpg") */
  storage_path: string;
  /** Current moderation status */
  status: PhotoStatus;
  /** Number of upvotes (denormalized) */
  upvote_count: number;
  /** When photo was uploaded */
  created_at: string;
}

/**
 * Photo with vote status for gallery display
 * Includes all photo data plus current user's vote status
 */
export interface PhotoWithVoteStatus extends Photo {
  /** Public URL for the photo image */
  url: string;
  /** Number of upvotes (camelCase for client) */
  upvoteCount: number;
  /** Photo width in pixels (if available) */
  width?: number;
  /** Photo height in pixels (if available) */
  height?: number;
  /** Whether current user has voted for this photo */
  hasVoted: boolean;
  /** Whether this photo belongs to the current user */
  isOwnPhoto: boolean;
}

/**
 * Simplified photo for list displays
 */
export interface PhotoSummary {
  id: string;
  url: string;
  upvoteCount: number;
  status: PhotoStatus;
}

/**
 * Photo vote record (snake_case matching database)
 */
export interface PhotoVote {
  id: string;
  user_id: string;
  photo_id: string;
  created_at: string;
}

/**
 * Result of toggling a vote (camelCase for API responses)
 */
export interface ToggleVoteResult {
  success: boolean;
  upvoteCount: number;
  hasVoted: boolean;
  error?: string;
}

/**
 * Photo upload result
 */
export interface PhotoUploadResult {
  success: boolean;
  photo?: PhotoWithVoteStatus;
  error?: string;
}

/**
 * Photo upload limits for a user
 */
export interface PhotoUploadLimits {
  /** Daily uploads used today */
  dailyUsed: number;
  /** Daily upload limit (10) */
  dailyLimit: number;
  /** Daily uploads remaining */
  dailyRemaining: number;
  /** Photos uploaded to this cafe */
  cafeUsed: number;
  /** Cafe photo limit (3) */
  cafeLimit: number;
  /** Photos remaining for this cafe */
  cafeRemaining: number;
  /** When daily limit resets */
  resetsAt: string;
}

/**
 * Input type for photo upload action
 */
export interface PhotoUploadInput {
  /** The file to upload */
  file: File;
  /** Target cafe ID */
  cafeId: string;
}

/**
 * Result type for photo upload action
 */
export interface UploadPhotoResult {
  success: boolean;
  photoId?: string;
  error?: string;
}

/**
 * Result type for photo delete action
 */
export interface DeletePhotoResult {
  success: boolean;
  error?: string;
}

/**
 * Result type for photo limit check
 */
export interface LimitCheckResult {
  canUpload: boolean;
  remainingCafe: number;
  remainingDaily: number;
}
