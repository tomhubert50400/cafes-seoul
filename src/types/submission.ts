import type { TranslatedText, OperatingHours } from './cafe';

/**
 * Submission status states
 */
export type SubmissionStatus = 'pending' | 'approved' | 'declined';

/**
 * User role types for the system
 */
export type UserRole = 'user' | 'pro' | 'admin';

/**
 * A cafe submission from a user awaiting admin approval
 */
export interface CafeSubmission {
  /** Unique identifier */
  id: string;
  
  /** User who submitted this cafe */
  userId: string;
  
  /** Cafe name in multiple languages */
  name: TranslatedText;
  
  /** Cafe address in multiple languages */
  address: TranslatedText;
  
  /** Optional phone number */
  phone: string | null;
  
  /** Optional latitude for geolocation */
  latitude: number | null;
  
  /** Optional longitude for geolocation */
  longitude: number | null;
  
  /** District reference (if known) */
  districtId: number | null;
  
  /** Neighborhood reference (if known) */
  neighborhoodId: number | null;

  /** Kakao Place ID (legacy, for existing data) */
  kakaoPlaceId: string | null;

  /** Naver Place ID (if selected from Naver search) */
  naverPlaceId: string | null;

  /** Current submission status */
  status: SubmissionStatus;
  
  /** Reason for declining (shown to user when declined) */
  rejectionReason: string | null;
  
  /** Internal admin notes (not shown to user) */
  adminNotes: string | null;
  
  /** When submission was created */
  createdAt: string;
  
  /** When submission was last updated */
  updatedAt: string;
  
  /** When submission was approved (if approved) */
  approvedAt: string | null;
  
  /** Admin who approved this submission */
  approvedBy: string | null;
  
  /** Reference to created cafe (populated when approved) */
  cafeId: string | null;

  /** Storage paths for submitted photos */
  photoUrls: string[];
}

/**
 * Input type for creating a new cafe submission
 * Excludes system-managed fields (id, userId, status, timestamps, admin fields)
 */
export interface CafeSubmissionInput {
  /** Cafe name in multiple languages */
  name: TranslatedText;
  
  /** Cafe address in multiple languages */
  address: TranslatedText;
  
  /** Optional phone number */
  phone?: string;
  
  /** Optional latitude for geolocation */
  latitude?: number;
  
  /** Optional longitude for geolocation */
  longitude?: number;
  
  /** District reference (if known) */
  districtId?: number;

  /** Neighborhood reference (if known) */
  neighborhoodId?: number;

  /** Kakao Place ID (if selected from Kakao search) */
  kakaoPlaceId?: string;

  /** Operating hours (optional, user-provided) */
  operatingHours?: OperatingHours;

  /** Storage paths for submitted photos (1-3 required) */
  photoUrls: string[];
}

/**
 * Fields that can be updated while a submission is pending
 */
export type CafeSubmissionUpdate = CafeSubmissionInput;

/**
 * Cafe submission with user information (for admin view)
 */
export interface SubmissionWithUser extends CafeSubmission {
  /** Submitter information */
  user: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    role?: UserRole;
  };
}

/**
 * Daily submission rate limit for a user
 */
export interface SubmissionRateLimit {
  /** User ID */
  userId: string;
  
  /** Number of submissions made today */
  submissionCount: number;
  
  /** When the daily limit resets */
  resetAt: string;
  
  /** Timestamp of most recent submission */
  lastSubmissionAt: string | null;
  
  /** Computed remaining submissions (max 3 per day) */
  remaining: number;
}

/**
 * Submission statistics for a user (profile page)
 */
export interface SubmissionStatistics {
  /** Total submissions count */
  total: number;
  
  /** Pending submissions count */
  pending: number;
  
  /** Approved submissions count */
  approved: number;
  
  /** Declined submissions count */
  declined: number;
}

/**
 * Submission status filter options
 */
export type SubmissionFilterStatus = 'all' | 'pending' | 'approved' | 'declined';

/**
 * Submission query parameters for fetching submissions
 */
export interface SubmissionQueryParams {
  /** Filter by status */
  status?: SubmissionFilterStatus;
  
  /** Number of results per page */
  limit?: number;
  
  /** Offset for pagination */
  offset?: number;
  
  /** Sort order */
  sortBy?: 'newest' | 'oldest';
}
