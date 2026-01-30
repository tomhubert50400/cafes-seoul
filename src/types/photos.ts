// ============================================
// PHOTO TYPES
// Phase 9: Photos & Voting
// ============================================

/**
 * Photo status enum values
 */
export type PhotoStatus = 'pending' | 'approved' | 'rejected';

/**
 * Photo with vote status for gallery display
 * Includes all photo data plus current user's vote status
 */
export interface PhotoWithVoteStatus {
  /** Unique photo identifier */
  id: string;
  /** Cafe this photo belongs to */
  cafeId: string;
  /** User who uploaded the photo */
  userId: string;
  /** Supabase Storage path (e.g., "cafes/uuid/filename.jpg") */
  storagePath: string;
  /** Public URL for the photo */
  url: string;
  /** Original filename */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** MIME type */
  mimeType: string;
  /** Width in pixels (if available) */
  width?: number;
  /** Height in pixels (if available) */
  height?: number;
  /** Current moderation status */
  status: PhotoStatus;
  /** Number of upvotes */
  upvoteCount: number;
  /** Admin rejection reason (if rejected) */
  rejectionReason?: string;
  /** When photo was uploaded */
  createdAt: string;
  /** When photo was last updated */
  updatedAt: string;
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
 * Photo vote record
 */
export interface PhotoVote {
  id: string;
  userId: string;
  photoId: string;
  createdAt: string;
}

/**
 * Result of toggling a vote
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
