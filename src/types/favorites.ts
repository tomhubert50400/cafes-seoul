// ============================================
// USER FAVORITES TYPE DEFINITIONS
// Phase 14: Favorites/Bookmarks for cafes
// ============================================

import type { TranslatedText } from './cafe';

/**
 * UserFavorite represents a user's favorited cafe
 */
export interface UserFavorite {
  /** Unique favorite identifier */
  id: string;
  /** User who favorited the cafe */
  userId: string;
  /** Cafe that was favorited */
  cafeId: string;
  /** When the favorite was created */
  createdAt: string;
}

/**
 * Cafe info for favorites display
 */
export interface FavoriteCafe {
  /** Cafe identifier */
  id: string;
  /** Cafe name in multiple languages */
  name: TranslatedText;
  /** Cafe slug for URLs */
  slug: string;
  /** Cafe address in multiple languages */
  address: TranslatedText;
  /** District identifier */
  districtId: string;
  /** Overall rating (may be null if not rated) */
  overallRating: number | null;
  /** Total number of ratings */
  totalRatings: number;
}

/**
 * Extended cafe info including primary image for favorites display
 */
export interface FavoriteCafeWithImage extends FavoriteCafe {
  /** Primary image URL for thumbnail display */
  primaryImageUrl: string | null;
}

/**
 * UserFavorite with extended cafe info including image
 * Used in Favorites list/grid
 */
export interface FavoriteWithCafe {
  /** Unique favorite identifier */
  id: string;
  /** Cafe that was favorited */
  cafeId: string;
  /** When the favorite was created */
  createdAt: string;
  /** Cafe with image for display */
  cafe: FavoriteCafeWithImage;
}

/**
 * Result type for toggle favorite operation
 */
export interface ToggleFavoriteResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Current favorited status after operation */
  isFavorited?: boolean;
  /** Error message if operation failed */
  error?: string;
}
