import { describe, it, expect } from 'vitest';
import { filterCafes, hasActiveFilters, getActiveFilterCount } from '../filter-cafes';
import type { CafeSummary } from '@/types/cafe';
import type { MapFilters } from '@/types/map';

const makeCafe = (overrides: Partial<CafeSummary> = {}): CafeSummary => ({
  id: '1',
  name: { en: 'Test Cafe', ko: '테스트 카페' },
  slug: 'test-cafe',
  address: { en: '123 Seoul St', ko: '서울시 123' },
  districtId: 1,
  latitude: 37.5,
  longitude: 127.0,
  overallRating: 4.0,
  totalRatings: 10,
  priceRange: 2,
  cafeType: 'cafe',
  hasWifi: true,
  hasPowerOutlets: true,
  isPetFriendly: false,
  isLaptopFriendly: true,
  hasParking: false,
  primaryImageUrl: null,
  ratings: {
    drinks: 4,
    wifi: 5,
    priceValue: 3,
    quietness: 4,
    seating: 3,
    comfort: 4,
    food: 3,
    lighting: 4,
    outlets: 5,
  },
  ...overrides,
});

describe('filterCafes', () => {
  it('returns all cafes when no filters are active', () => {
    const cafes = [makeCafe(), makeCafe({ id: '2' })];
    const result = filterCafes(cafes, {});
    expect(result).toHaveLength(2);
  });

  it('filters by wifi requirement', () => {
    const cafes = [
      makeCafe({ id: '1', hasWifi: true }),
      makeCafe({ id: '2', hasWifi: false }),
    ];
    const result = filterCafes(cafes, { hasWifi: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by pet friendly', () => {
    const cafes = [
      makeCafe({ id: '1', isPetFriendly: true }),
      makeCafe({ id: '2', isPetFriendly: false }),
    ];
    const result = filterCafes(cafes, { isPetFriendly: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by minimum service rating', () => {
    const cafes = [
      makeCafe({ id: '1', ratings: { drinks: null, service: 4, priceValue: null, quietness: null, seating: null, comfort: null, food: null, lighting: null, aesthetic: null } }),
      makeCafe({ id: '2', ratings: { drinks: null, service: 2, priceValue: null, quietness: null, seating: null, comfort: null, food: null, lighting: null, aesthetic: null } }),
    ];
    const result = filterCafes(cafes, { serviceMin: 3 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by price range', () => {
    const cafes = [
      makeCafe({ id: '1', priceRange: 1 }),
      makeCafe({ id: '2', priceRange: 3 }),
    ];
    const result = filterCafes(cafes, { priceRange: [1, 2] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by district', () => {
    const cafes = [
      makeCafe({ id: '1', districtId: 1 }),
      makeCafe({ id: '2', districtId: 5 }),
    ];
    const result = filterCafes(cafes, { districts: [1, 2] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('applies multiple filters (AND logic)', () => {
    const cafes = [
      makeCafe({ id: '1', hasWifi: true, isPetFriendly: true }),
      makeCafe({ id: '2', hasWifi: true, isPetFriendly: false }),
      makeCafe({ id: '3', hasWifi: false, isPetFriendly: true }),
    ];
    const result = filterCafes(cafes, { hasWifi: true, isPetFriendly: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('excludes cafes with null ratings when rating filter is set', () => {
    const cafes = [
      makeCafe({ id: '1', ratings: { drinks: null, service: null, priceValue: null, quietness: null, seating: null, comfort: null, food: null, lighting: null, aesthetic: null } }),
    ];
    const result = filterCafes(cafes, { serviceMin: 3 });
    expect(result).toHaveLength(0);
  });
});

describe('hasActiveFilters', () => {
  it('returns false for empty filters', () => {
    expect(hasActiveFilters({})).toBe(false);
  });

  it('returns true when a boolean filter is active', () => {
    expect(hasActiveFilters({ hasWifi: true })).toBe(true);
  });

  it('returns true when a numeric filter is active', () => {
    expect(hasActiveFilters({ serviceMin: 3 })).toBe(true);
  });

  it('returns true when an array filter is active', () => {
    expect(hasActiveFilters({ priceRange: [1, 2] })).toBe(true);
  });

  it('returns false for zero numeric filters', () => {
    expect(hasActiveFilters({ wifiMin: 0 })).toBe(false);
  });
});

describe('getActiveFilterCount', () => {
  it('returns 0 for empty filters', () => {
    expect(getActiveFilterCount({})).toBe(0);
  });

  it('counts active filters correctly', () => {
    expect(getActiveFilterCount({ hasWifi: true, wifiMin: 3, priceRange: [1] })).toBe(3);
  });
});
