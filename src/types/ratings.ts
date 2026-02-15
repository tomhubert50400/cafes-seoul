// ============================================
// CAFE RATINGS TYPE DEFINITIONS
// Phase 8: User ratings with 10 dimensions
// ============================================

import type { TranslatedText } from './cafe';

/**
 * UserRating represents a user's rating for a cafe
 * Overall rating is mandatory (1-5), all other dimensions are optional (0-5, 0 = not rated)
 */
export interface UserRating {
  /** Unique rating identifier */
  id: string;
  /** User who submitted the rating */
  userId: string;
  /** Cafe being rated */
  cafeId: string;
  
  // Mandatory dimension
  /** Overall rating 1-5 (required) */
  overall: number;
  
  // Optional dimensions (0 = not rated, 1-5 = valid rating)
  /** Drinks quality rating 0-5 */
  drinks: number;
  /** Staff/service quality rating 0-5 */
  service: number;
  /** Price/value rating 0-5 */
  priceValue: number;
  /** Quietness rating 0-5 */
  quietness: number;
  /** Seating comfort/availability rating 0-5 */
  seating: number;
  /** General comfort rating 0-5 */
  comfort: number;
  /** Food quality rating 0-5 */
  food: number;
  /** Lighting/ambiance rating 0-5 */
  lighting: number;
  /** Aesthetic/ambiance/decor rating 0-5 */
  aesthetic: number;
  
  // Boolean feature indicators
  /** Whether the user marked cafe as having wifi */
  hasWifi: boolean;
  /** Whether the user marked cafe as having power outlets */
  hasPowerOutlets: boolean;
  /** Whether the user marked cafe as laptop-friendly */
  isLaptopFriendly: boolean;
  /** Whether the user marked cafe as pet-friendly */
  petFriendly: boolean;
  /** Whether the user marked cafe as having parking */
  hasParking: boolean;
  
  // Review text (Phase 16)
  /** Optional review text content (max 500 chars) */
  reviewText: string | null;
  /** When review text was last edited (null if never edited) */
  reviewEditedAt: string | null;

  // Metadata
  /** When the rating was first submitted */
  createdAt: string;
  /** When the rating was last updated */
  updatedAt: string;

  // Joined data (populated when fetching with relations)
  /** User who made the rating (optional, from joined query) */
  user?: RatingUser;
  /** Cafe being rated (optional, from joined query) */
  cafe?: RatingCafe;
}

/**
 * Simplified user info for rating display
 */
export interface RatingUser {
  /** User identifier */
  id: string;
  /** User's username */
  username: string;
  /** User's display name (may be null) */
  displayName: string | null;
  /** User's avatar URL (may be null) */
  avatarUrl: string | null;
}

/**
 * Simplified cafe info for rating display
 */
export interface RatingCafe {
  /** Cafe identifier */
  id: string;
  /** Cafe name in multiple languages */
  name: TranslatedText;
  /** Cafe slug for URLs */
  slug: string;
}

/**
 * Extended cafe info including primary image for review display
 */
export interface RatingCafeWithImage extends RatingCafe {
  /** Primary image URL for thumbnail display */
  primaryImageUrl: string | null;
}

/**
 * UserRating with extended cafe info including image
 * Used in My Reviews list
 */
export interface UserRatingWithImage extends Omit<UserRating, 'cafe'> {
  /** Cafe with image for thumbnail display */
  cafe: RatingCafeWithImage;
}

/**
 * Input type for creating or updating a rating
 * Used in forms and API requests
 */
export interface RatingInput {
  /** Cafe being rated (required) */
  cafeId: string;
  /** Overall rating 1-5 (required) */
  overall: number;

  // Optional dimensions (undefined = 0 = not rated)
  /** Drinks quality rating (undefined = not rated) */
  drinks?: number;
  /** Staff/service quality rating (undefined = not rated) */
  service?: number;
  /** Price/value rating (undefined = not rated) */
  priceValue?: number;
  /** Quietness rating (undefined = not rated) */
  quietness?: number;
  /** Seating comfort/availability rating (undefined = not rated) */
  seating?: number;
  /** General comfort rating (undefined = not rated) */
  comfort?: number;
  /** Food quality rating (undefined = not rated) */
  food?: number;
  /** Lighting/ambiance rating (undefined = not rated) */
  lighting?: number;
  /** Aesthetic/ambiance/decor rating (undefined = not rated) */
  aesthetic?: number;

  /** Wifi indicator (default: false) */
  hasWifi?: boolean;
  /** Power outlets indicator (default: false) */
  hasPowerOutlets?: boolean;
  /** Laptop-friendly indicator (default: false) */
  isLaptopFriendly?: boolean;
  /** Pet-friendly indicator (default: false) */
  petFriendly?: boolean;
  /** Parking indicator (default: false) */
  hasParking?: boolean;

  /** Optional review text (max 500 chars) */
  reviewText?: string;
}

/**
 * Dimension labels in Korean and English
 * Used for UI display and i18n
 */
export const RATING_DIMENSION_LABELS: Record<UserRatingDimension, { ko: string; en: string }> = {
  overall: { ko: '전체 평점', en: 'Overall' },
  drinks: { ko: '음료', en: 'Drinks' },
  service: { ko: '서비스', en: 'Service' },
  priceValue: { ko: '가성비', en: 'Value' },
  quietness: { ko: '조용함', en: 'Quietness' },
  seating: { ko: '좌석', en: 'Seating' },
  comfort: { ko: '편안함', en: 'Comfort' },
  food: { ko: '음식', en: 'Food' },
  petFriendly: { ko: '반려동물 친화', en: 'Pet Friendly' },
  lighting: { ko: '조명', en: 'Lighting' },
  aesthetic: { ko: '인테리어', en: 'Aesthetic' },
};

/**
 * All user rating dimensions (for user-submitted ratings)
 * Distinct from cafe.ts RatingDimension which is for aggregated cafe data
 */
export type UserRatingDimension = 
  | 'overall'
  | 'drinks'
  | 'service'
  | 'priceValue'
  | 'quietness'
  | 'seating'
  | 'comfort'
  | 'food'
  | 'petFriendly'
  | 'lighting'
  | 'aesthetic';

/**
 * Numeric rating dimensions only (excluding petFriendly boolean)
 */
export type NumericRatingDimension = 
  | 'overall'
  | 'drinks'
  | 'service'
  | 'priceValue'
  | 'quietness'
  | 'seating'
  | 'comfort'
  | 'food'
  | 'lighting'
  | 'aesthetic';

/**
 * Optional numeric dimensions (not including overall which is mandatory)
 */
export type OptionalRatingDimension =
  | 'drinks'
  | 'service'
  | 'priceValue'
  | 'quietness'
  | 'seating'
  | 'comfort'
  | 'food'
  | 'lighting'
  | 'aesthetic';

/**
 * Rating sections for UI organization
 * Groups related dimensions together
 */
export const RATING_SECTIONS = {
  /** Essential cafe qualities */
  essentials: ['drinks', 'wifi', 'priceValue'] as const,
  /** Comfort-related aspects */
  comfort: ['quietness', 'seating', 'comfort'] as const,
  /** Additional features */
  extras: ['food', 'petFriendly', 'lighting', 'outlets'] as const,
};

/**
 * Section labels for UI display
 */
export const RATING_SECTION_LABELS: Record<RatingSection, { ko: string; en: string }> = {
  essentials: { ko: '필수', en: 'Essentials' },
  comfort: { ko: '편안함', en: 'Comfort' },
  extras: { ko: '추가', en: 'Extras' },
};

/**
 * Rating section types
 */
export type RatingSection = 'essentials' | 'comfort' | 'extras';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a rating dimension is optional (not mandatory)
 * @param dim - The dimension to check
 * @returns true if the dimension is optional
 */
export function isRatingDimensionOptional(dim: UserRatingDimension): boolean {
  return dim !== 'overall';
}

/**
 * Get the list of dimensions that have been rated (non-zero values)
 * Excludes petFriendly since it's a boolean
 * @param rating - The UserRating object
 * @returns Array of dimension names with non-zero ratings
 */
export function getRatedDimensions(rating: UserRating): OptionalRatingDimension[] {
  const dimensions: OptionalRatingDimension[] = [
    'drinks', 'wifi', 'priceValue', 'quietness', 
    'seating', 'comfort', 'food', 'lighting', 'outlets'
  ];
  
  return dimensions.filter(dim => rating[dim] > 0);
}

/**
 * Calculate average of optional dimensions that have been rated
 * Returns null if no optional dimensions have been rated
 * @param rating - The UserRating object
 * @returns Average of rated dimensions (1-5) or null if none rated
 */
export function getOptionalAverage(rating: UserRating): number | null {
  const dimensions: OptionalRatingDimension[] = [
    'drinks', 'wifi', 'priceValue', 'quietness', 
    'seating', 'comfort', 'food', 'lighting', 'outlets'
  ];
  
  const ratedValues = dimensions
    .map(dim => rating[dim])
    .filter(value => value > 0);
  
  if (ratedValues.length === 0) {
    return null;
  }
  
  const sum = ratedValues.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / ratedValues.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Count how many optional dimensions have been rated
 * @param rating - The UserRating object
 * @returns Count of dimensions with non-zero ratings
 */
export function getRatedCount(rating: UserRating): number {
  return getRatedDimensions(rating).length;
}

/**
 * Check if a rating value is valid for a dimension
 * @param value - The rating value
 * @param dimension - The dimension being rated
 * @returns true if valid
 */
export function isValidRating(value: number, dimension: UserRatingDimension): boolean {
  if (dimension === 'petFriendly') {
    return typeof value === 'boolean';
  }
  
  if (dimension === 'overall') {
    return Number.isInteger(value) && value >= 1 && value <= 5;
  }
  
  // Optional dimensions: 0-5
  return Number.isInteger(value) && value >= 0 && value <= 5;
}

/**
 * Get the minimum valid rating for a dimension
 * @param dimension - The dimension
 * @returns Minimum valid value (0 or 1)
 */
export function getMinRating(dimension: NumericRatingDimension): number {
  return dimension === 'overall' ? 1 : 0;
}

/**
 * Get the maximum valid rating for any dimension
 * @returns Always 5
 */
export function getMaxRating(): number {
  return 5;
}

/**
 * Create a default empty rating input for a cafe
 * @param cafeId - The cafe ID
 * @returns RatingInput with defaults
 */
export function createEmptyRatingInput(cafeId: string): RatingInput {
  return {
    cafeId,
    overall: 0, // User must set this
    drinks: 0,
    wifi: 0,
    priceValue: 0,
    quietness: 0,
    seating: 0,
    comfort: 0,
    food: 0,
    lighting: 0,
    outlets: 0,
    hasWifi: false,
    hasPowerOutlets: false,
    isLaptopFriendly: false,
    petFriendly: false,
    hasParking: false,
  };
}

/**
 * Convert RatingInput to database format (snake_case)
 * @param input - The RatingInput
 * @returns Object with snake_case keys for database
 */
export function toDatabaseRating(input: RatingInput): Record<string, unknown> {
  return {
    cafe_id: input.cafeId,
    overall: input.overall,
    drinks: input.drinks ?? 0,
    wifi: input.wifi ?? 0,
    price_value: input.priceValue ?? 0,
    quietness: input.quietness ?? 0,
    seating: input.seating ?? 0,
    comfort: input.comfort ?? 0,
    food: input.food ?? 0,
    lighting: input.lighting ?? 0,
    outlets: input.outlets ?? 0,
    has_wifi: input.hasWifi ?? false,
    has_power_outlets: input.hasPowerOutlets ?? false,
    is_laptop_friendly: input.isLaptopFriendly ?? false,
    pet_friendly: input.petFriendly ?? false,
    has_parking: input.hasParking ?? false,
  };
}
