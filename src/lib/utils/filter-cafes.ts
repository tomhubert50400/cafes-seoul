import type { CafeSummary } from '@/types/cafe';
import type { MapFilters } from '@/types/map';
import { isCafeOpenNow } from '@/lib/hours';

/**
 * Filter cafes based on rating criteria and features
 * Returns only cafes that match ALL active filters
 */
export function filterCafes(
  cafes: CafeSummary[],
  filters: MapFilters
): CafeSummary[] {
  return cafes.filter((cafe) => {
    // Rating filters - cafe must have rating AND meet minimum
    if (filters.seatingMin != null && filters.seatingMin > 0) {
      const rating = cafe.ratings?.seating;
      if (rating == null || rating < filters.seatingMin) return false;
    }
    
    if (filters.wifiMin != null && filters.wifiMin > 0) {
      const rating = cafe.ratings?.wifi;
      if (rating == null || rating < filters.wifiMin) return false;
    }
    
    if (filters.foodMin != null && filters.foodMin > 0) {
      const rating = cafe.ratings?.food;
      if (rating == null || rating < filters.foodMin) return false;
    }
    
    if (filters.drinksMin != null && filters.drinksMin > 0) {
      const rating = cafe.ratings?.drinks;
      if (rating == null || rating < filters.drinksMin) return false;
    }
    
    if (filters.lightingMin != null && filters.lightingMin > 0) {
      const rating = cafe.ratings?.lighting;
      if (rating == null || rating < filters.lightingMin) return false;
    }

    if (filters.outletsMin != null && filters.outletsMin > 0) {
      const rating = cafe.ratings?.outlets;
      if (rating == null || rating < filters.outletsMin) return false;
    }

    if (filters.quietnessMin != null && filters.quietnessMin > 0) {
      const rating = cafe.ratings?.quietness;
      if (rating == null || rating < filters.quietnessMin) return false;
    }

    if (filters.priceValueMin != null && filters.priceValueMin > 0) {
      const rating = cafe.ratings?.priceValue;
      if (rating == null || rating < filters.priceValueMin) return false;
    }

    if (filters.comfortMin != null && filters.comfortMin > 0) {
      const rating = cafe.ratings?.comfort;
      if (rating == null || rating < filters.comfortMin) return false;
    }
    
    // Boolean feature filters
    if (filters.hasWifi && !cafe.hasWifi) return false;
    if (filters.hasPowerOutlets && !cafe.hasPowerOutlets) return false;
    if (filters.isPetFriendly && !cafe.isPetFriendly) return false;
    if (filters.isLaptopFriendly && !cafe.isLaptopFriendly) return false;
    if (filters.hasParking && !cafe.hasParking) return false;
    
    // Price range filter
    if (filters.priceRange?.length) {
      if (!filters.priceRange.includes(cafe.priceRange)) return false;
    }
    
    // Cafe type filter
    if (filters.cafeTypes?.length) {
      if (!filters.cafeTypes.includes(cafe.cafeType)) return false;
    }
    
    // District filter
    if (filters.districts?.length) {
      if (!filters.districts.includes(cafe.districtId)) return false;
    }
    
    return true;
  });
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: MapFilters): boolean {
  return Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'number') return value > 0;
    return value != null && value !== false;
  });
}

/**
 * Get count of active filters
 */
export function getActiveFilterCount(filters: MapFilters): number {
  return Object.values(filters).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'number') return value > 0;
    return value != null && value !== false;
  }).length;
}
