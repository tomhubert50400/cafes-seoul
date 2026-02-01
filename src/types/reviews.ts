// ============================================
// REVIEW TYPE DEFINITIONS
// Phase 16: Text reviews with helpful voting
// ============================================

/**
 * Author info for review display
 * Minimal user data shown with each review
 */
export interface ReviewAuthor {
  /** User identifier */
  id: string;
  /** User's username (always present) */
  username: string;
  /** User's display name (may be null) */
  displayName: string | null;
  /** User's avatar URL (may be null) */
  avatarUrl: string | null;
  /** Whether user's profile is public (for linking) */
  profilePublic: boolean;
}

/**
 * Review with author info for display
 * Extends rating data with review-specific fields
 */
export interface ReviewWithAuthor {
  /** Rating/review identifier */
  id: string;
  /** Cafe being reviewed */
  cafeId: string;
  /** User who wrote the review */
  userId: string;
  /** Overall rating 1-5 */
  overall: number;
  /** Optional text review (max 500 chars) */
  reviewText: string | null;
  /** When review text was last edited (null if never edited) */
  reviewEditedAt: string | null;
  /** When the rating was first submitted */
  createdAt: string;
  /** Author info for display */
  author: ReviewAuthor;
  /** Number of helpful votes */
  helpfulCount: number;
  /** Whether current user has voted this review helpful */
  userHasVoted: boolean;
  /** Whether this is the current user's own review */
  isOwnReview: boolean;
}

/**
 * Helpful vote record
 */
export interface HelpfulVote {
  /** Vote identifier */
  id: string;
  /** User who voted */
  userId: string;
  /** Rating/review that was voted helpful */
  ratingId: string;
  /** When the vote was created */
  createdAt: string;
}

/**
 * Result type for update review text action
 */
export interface UpdateReviewTextResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Result type for toggle helpful vote action
 */
export interface ToggleHelpfulResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Current voted status after operation */
  isVoted?: boolean;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Form data for review text input
 */
export interface ReviewTextFormData {
  /** Review text content (can be empty for deletion) */
  reviewText: string;
}
