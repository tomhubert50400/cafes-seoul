import type { Cafe, CafeSummary, RatingBreakdown, OperatingHours, CafeType, CafeStatus, TranslatedText } from '@/types/cafe';
import type { Review, ReviewUser, ReviewCafe, VisitPurpose, ReviewStatus } from '@/types/review';
import type { User, UserProfile } from '@/types/user';
import type { UserRating, RatingUser, RatingCafe, RatingCafeWithImage } from '@/types/ratings';

const CAFE_IMAGES_BUCKET = 'cafe-images';

export function getStorageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/${CAFE_IMAGES_BUCKET}/${path}`;
}

// Transform database cafe row to Cafe type
export function transformCafe(row: Record<string, unknown>): Cafe {
  return {
    id: row.id as string,
    name: (row.name || {}) as TranslatedText,
    slug: row.slug as string,
    description: row.description as TranslatedText | null,
    address: (row.address || {}) as TranslatedText,
    districtId: row.district_id as number,
    neighborhoodId: row.neighborhood_id as number | null,
    latitude: parseFloat(row.latitude as string),
    longitude: parseFloat(row.longitude as string),
    phone: row.phone as string | null,
    website: row.website as string | null,
    instagramHandle: row.instagram_handle as string | null,
    naverPlaceId: row.naver_place_id as string | null,
    kakaoPlaceId: row.kakao_place_id as string | null,
    operatingHours: (row.operating_hours || {}) as OperatingHours,
    hasWifi: row.has_wifi as boolean,
    hasPowerOutlets: row.has_power_outlets as boolean,
    hasParking: row.has_parking as boolean,
    isPetFriendly: row.is_pet_friendly as boolean,
    hasOutdoorSeating: row.has_outdoor_seating as boolean,
    hasReservations: row.has_reservations as boolean,
    isLaptopFriendly: row.is_laptop_friendly as boolean,
    hasMeetingRooms: row.has_meeting_rooms as boolean,
    seatingCapacity: row.seating_capacity as number | null,
    seatingTypes: (row.seating_types || []) as string[],
    priceRange: row.price_range as 1 | 2 | 3 | 4,
    averageDrinkPrice: row.average_drink_price as number | null,
    cafeType: row.cafe_type as CafeType,
    specialties: (row.specialties || []) as string[],
    overallRating: parseFloat(row.overall_rating as string) || 0,
    totalRatings: row.total_ratings as number,
    ratings: {
      drinks: row.rating_drinks ? parseFloat(row.rating_coffee as string) : null,
      wifi: row.rating_wifi ? parseFloat(row.rating_wifi as string) : null,
      priceValue: row.rating_price_value ? parseFloat(row.rating_price_value as string) : null,
      quietness: row.rating_quietness ? parseFloat(row.rating_quietness as string) : null,
      seating: row.rating_seating ? parseFloat(row.rating_seating as string) : null,
      comfort: row.rating_comfort ? parseFloat(row.rating_comfort as string) : null,
      food: row.rating_food ? parseFloat(row.rating_food as string) : null,
      lighting: row.rating_lighting ? parseFloat(row.rating_lighting as string) : null,
      outlets: row.rating_outlets ? parseFloat(row.rating_outlets as string) : null,
    },
    status: row.status as CafeStatus,
    verifiedAt: row.verified_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Transform database cafe row to CafeSummary type
export function transformCafeSummary(row: Record<string, unknown>): CafeSummary {
  return {
    id: row.id as string,
    name: (row.name || {}) as TranslatedText,
    slug: row.slug as string,
    address: (row.address || {}) as TranslatedText,
    districtId: row.district_id as number,
    latitude: parseFloat(row.latitude as string),
    longitude: parseFloat(row.longitude as string),
    overallRating: parseFloat(row.overall_rating as string) || 0,
    totalRatings: row.total_ratings as number,
    priceRange: row.price_range as 1 | 2 | 3 | 4,
    cafeType: row.cafe_type as CafeType,
    hasWifi: row.has_wifi as boolean,
    hasPowerOutlets: row.has_power_outlets as boolean,
    isPetFriendly: row.has_pet_friendly as boolean,
    isLaptopFriendly: row.has_laptop_friendly as boolean,
    hasParking: row.has_parking as boolean,
    primaryImageUrl: getStorageUrl(row.primary_image_url as string | null),
    distance: row.distance_meters ? parseFloat(row.distance_meters as string) : undefined,
    ratings: {
      drinks: row.rating_drinks ? parseFloat(row.rating_coffee as string) : null,
      wifi: row.rating_wifi ? parseFloat(row.rating_wifi as string) : null,
      priceValue: row.rating_price_value ? parseFloat(row.rating_price_value as string) : null,
      quietness: row.rating_quietness ? parseFloat(row.rating_quietness as string) : null,
      seating: row.rating_seating ? parseFloat(row.rating_seating as string) : null,
      comfort: row.rating_comfort ? parseFloat(row.rating_comfort as string) : null,
      food: row.rating_food ? parseFloat(row.rating_food as string) : null,
      lighting: row.rating_lighting ? parseFloat(row.rating_lighting as string) : null,
      outlets: row.rating_outlets ? parseFloat(row.rating_outlets as string) : null,
    },
  };
}

// Transform database review row to Review type
export function transformReview(row: Record<string, unknown>): Review {
  const user = row.profiles as Record<string, unknown> | null;
  const cafe = row.cafes as Record<string, unknown> | null;

  return {
    id: row.id as string,
    cafeId: row.cafe_id as string,
    userId: row.user_id as string,
    ratingFood: row.rating_food as number | null,
    ratingDrinks: row.rating_drinks as number | null,
    ratingTemperature: row.rating_temperature as number | null,
    ratingSeating: row.rating_seating as number | null,
    ratingAmbiance: row.rating_ambiance as number | null,
    ratingWifi: row.rating_wifi as number | null,
    ratingNoise: row.rating_noise as number | null,
    ratingOutlets: row.rating_outlets as number | null,
    ratingValue: row.rating_value as number | null,
    ratingOverall: parseFloat(row.rating_overall as string) || 0,
    title: row.title as string | null,
    content: row.content as string | null,
    visitDate: row.visit_date as string | null,
    visitPurpose: row.visit_purpose as VisitPurpose | null,
    helpfulCount: row.helpful_count as number,
    status: row.status as ReviewStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    user: user ? transformReviewUser(user) : undefined,
    cafe: cafe ? transformReviewCafe(cafe) : undefined,
    userVote: row.user_vote as boolean | null | undefined,
  };
}

export function transformReviewUser(row: Record<string, unknown>): ReviewUser {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string | null,
    avatarUrl: row.avatar_url as string | null,
    isVerified: row.is_verified as boolean,
    totalReviews: row.total_reviews as number,
  };
}

export function transformReviewCafe(row: Record<string, unknown>): ReviewCafe {
  const name = row.name as TranslatedText | null;
  return {
    id: row.id as string,
    name: name || {},
    slug: row.slug as string,
  };
}

export function transformUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    username: row.username as string,
    displayName: row.display_name as string | null,
    avatarUrl: row.avatar_url as string | null,
    bio: row.bio as string | null,
    preferredLanguage: row.preferred_language as string,
    isModerator: row.is_moderator as boolean,
    isVerified: row.is_verified as boolean,
    role: (row.role as string || 'user') as import('@/types/user').UserRole,
    roleUpdatedAt: row.role_updated_at as string | null,
    totalReviews: row.total_reviews as number,
    totalHelpfulVotes: row.total_helpful_votes as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function transformUserProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string | null,
    avatarUrl: row.avatar_url as string | null,
    bio: row.bio as string | null,
    isVerified: row.is_verified as boolean,
    role: (row.role as string || 'user') as import('@/types/user').UserRole,
    totalReviews: row.total_reviews as number,
    totalHelpfulVotes: row.total_helpful_votes as number,
    createdAt: row.created_at as string,
  };
}

// ============================================
// SUBMISSION TRANSFORMS
// ============================================

import type { CafeSubmission, SubmissionRateLimit, SubmissionStatus } from '@/types/submission';

/**
 * Transform database cafe_submissions row to CafeSubmission type
 */
export function transformCafeSubmission(row: Record<string, unknown>): CafeSubmission {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: (row.name || {}) as TranslatedText,
    address: (row.address || {}) as TranslatedText,
    phone: row.phone as string | null,
    latitude: row.latitude ? parseFloat(row.latitude as string) : null,
    longitude: row.longitude ? parseFloat(row.longitude as string) : null,
    districtId: row.district_id as number | null,
    neighborhoodId: row.neighborhood_id as number | null,
    status: row.status as SubmissionStatus,
    rejectionReason: row.rejection_reason as string | null,
    adminNotes: row.admin_notes as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    approvedAt: row.approved_at as string | null,
    approvedBy: row.approved_by as string | null,
    cafeId: row.cafe_id as string | null,
  };
}

/**
 * Transform database row to lightweight CafeSubmissionSummary
 * Used for list views where only basic info is needed
 */
export function transformCafeSubmissionSummary(row: Record<string, unknown>): Pick<CafeSubmission, 'id' | 'name' | 'address' | 'status' | 'createdAt'> {
  return {
    id: row.id as string,
    name: (row.name || {}) as TranslatedText,
    address: (row.address || {}) as TranslatedText,
    status: row.status as SubmissionStatus,
    createdAt: row.created_at as string,
  };
}

/**
 * Transform database submission_rate_limits row to SubmissionRateLimit type
 * Calculates remaining submissions (max 3 per day)
 */
export function transformSubmissionRateLimit(row: Record<string, unknown>): SubmissionRateLimit {
  const submissionCount = row.submission_count as number || 0;
  const resetAt = row.reset_at as string;

  // Calculate remaining submissions
  // If reset time has passed, user has full 3 submissions available
  const hasReset = new Date(resetAt) < new Date();
  const remaining = hasReset ? 3 : Math.max(0, 3 - submissionCount);

  return {
    userId: row.user_id as string,
    submissionCount,
    resetAt,
    lastSubmissionAt: row.last_submission_at as string | null,
    remaining,
  };
}

// ============================================
// RATING TRANSFORMS
// ============================================

/**
 * Transform database cafe_ratings row to UserRating type
 * Handles joined profiles and cafes data for user/cafe info
 */
export function transformUserRating(row: Record<string, unknown>): UserRating {
  const user = row.profiles as Record<string, unknown> | null;
  const cafe = row.cafes as Record<string, unknown> | null;

  return {
    id: row.id as string,
    userId: row.user_id as string,
    cafeId: row.cafe_id as string,
    overall: parseInt(row.overall as string, 10) || 0,
    drinks: parseInt(row.drinks as string, 10) || 0,
    wifi: parseInt(row.wifi as string, 10) || 0,
    priceValue: parseInt(row.price_value as string, 10) || 0,
    quietness: parseInt(row.quietness as string, 10) || 0,
    seating: parseInt(row.seating as string, 10) || 0,
    comfort: parseInt(row.comfort as string, 10) || 0,
    food: parseInt(row.food as string, 10) || 0,
    petFriendly: row.pet_friendly as boolean || false,
    lighting: parseInt(row.lighting as string, 10) || 0,
    outlets: parseInt(row.outlets as string, 10) || 0,
    reviewText: row.review_text as string | null,
    reviewEditedAt: row.review_edited_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    user: user ? transformRatingUser(user) : undefined,
    cafe: cafe ? transformRatingCafe(cafe) : undefined,
  };
}

/**
 * Transform database profiles row to RatingUser type
 * Lightweight user info for rating display
 */
export function transformRatingUser(row: Record<string, unknown>): RatingUser {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string | null,
    avatarUrl: row.avatar_url as string | null,
  };
}

/**
 * Transform database cafes row to RatingCafe type
 * Lightweight cafe info for rating display
 */
export function transformRatingCafe(row: Record<string, unknown>): RatingCafe {
  const name = row.name as Record<string, string> | null;
  return {
    id: row.id as string,
    name: name || {},
    slug: row.slug as string,
  };
}

/**
 * Transform database cafes row with images to RatingCafeWithImage type
 */
export function transformRatingCafeWithImage(row: Record<string, unknown>): RatingCafeWithImage {
  const name = row.name as Record<string, string> | null;
  const cafeImages = row.cafe_images as Array<{ storage_path: string }> | null;
  const primaryImage = cafeImages?.[0]?.storage_path || null;

  return {
    id: row.id as string,
    name: name || {},
    slug: row.slug as string,
    primaryImageUrl: getStorageUrl(primaryImage),
  };
}
