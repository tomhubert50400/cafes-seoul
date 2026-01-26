import type { CafeType } from './cafe';

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Cafe list query parameters
export interface CafeListParams {
  // Pagination
  page?: number;
  limit?: number;

  // Location
  lat?: number;
  lng?: number;
  radius?: number; // in meters
  district?: string; // district slug
  neighborhood?: string; // neighborhood slug
  bounds?: string; // "swLat,swLng,neLat,neLng"

  // Filters
  minRating?: number;
  priceRange?: string; // comma-separated: "1,2,3"
  cafeType?: CafeType;

  // Boolean features
  hasWifi?: boolean;
  hasOutlets?: boolean;
  isPetFriendly?: boolean;
  isLaptopFriendly?: boolean;
  hasParking?: boolean;
  hasOutdoorSeating?: boolean;

  // Rating-specific filters (minimum values)
  minFoodRating?: number;
  minDrinkRating?: number;
  minAmbianceRating?: number;
  minWifiRating?: number;
  minNoiseRating?: number;
  minOutletRating?: number;

  // Sorting
  sortBy?: 'rating' | 'distance' | 'reviews' | 'newest';
  sortOrder?: 'asc' | 'desc';

  // Search
  q?: string; // full-text search
}

// Review list query parameters
export interface ReviewListParams {
  page?: number;
  limit?: number;
  cafeId?: string;
  userId?: string;
  sortBy?: 'newest' | 'oldest' | 'helpful' | 'rating_high' | 'rating_low';
}

// Map bounds for viewport queries
export interface MapBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

// Error response
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}
