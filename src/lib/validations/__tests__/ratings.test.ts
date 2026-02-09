import { describe, it, expect } from 'vitest';
import { ratingFormSchema, hasOptionalRatings, toRatingInput } from '../ratings';
import type { RatingFormData } from '../ratings';

const validRating: RatingFormData = {
  cafeId: '550e8400-e29b-41d4-a716-446655440000',
  overall: 4,
  drinks: 0,
  wifi: 0,
  priceValue: 0,
  quietness: 0,
  seating: 0,
  comfort: 0,
  food: 0,
  hasWifi: false,
  hasPowerOutlets: false,
  isLaptopFriendly: false,
  petFriendly: false,
  hasParking: false,
  lighting: 0,
  outlets: 0,
};

describe('ratingFormSchema', () => {
  it('validates a minimal valid rating', () => {
    const result = ratingFormSchema.safeParse({
      cafeId: '550e8400-e29b-41d4-a716-446655440000',
      overall: 3,
    });
    expect(result.success).toBe(true);
  });

  it('validates a full rating with all dimensions', () => {
    const result = ratingFormSchema.safeParse({
      cafeId: '550e8400-e29b-41d4-a716-446655440000',
      overall: 5,
      drinks: 4,
      wifi: 3,
      priceValue: 5,
      quietness: 2,
      seating: 4,
      comfort: 3,
      food: 5,
      hasWifi: true,
      hasPowerOutlets: true,
      isLaptopFriendly: true,
      petFriendly: false,
      hasParking: true,
      lighting: 4,
      outlets: 3,
      reviewText: 'Great cafe!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects overall rating of 0', () => {
    const result = ratingFormSchema.safeParse({
      cafeId: '550e8400-e29b-41d4-a716-446655440000',
      overall: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects overall rating above 5', () => {
    const result = ratingFormSchema.safeParse({
      cafeId: '550e8400-e29b-41d4-a716-446655440000',
      overall: 6,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID for cafeId', () => {
    const result = ratingFormSchema.safeParse({
      cafeId: 'not-a-uuid',
      overall: 3,
    });
    expect(result.success).toBe(false);
  });

  it('rejects review text over 500 characters', () => {
    const result = ratingFormSchema.safeParse({
      cafeId: '550e8400-e29b-41d4-a716-446655440000',
      overall: 3,
      reviewText: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('allows empty review text', () => {
    const result = ratingFormSchema.safeParse({
      cafeId: '550e8400-e29b-41d4-a716-446655440000',
      overall: 3,
      reviewText: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('hasOptionalRatings', () => {
  it('returns false when all dimensions are 0 and booleans false', () => {
    expect(hasOptionalRatings(validRating)).toBe(false);
  });

  it('returns true when a dimension is rated', () => {
    expect(hasOptionalRatings({ ...validRating, drinks: 3 })).toBe(true);
  });

  it('returns true when a boolean feature is set', () => {
    expect(hasOptionalRatings({ ...validRating, hasWifi: true })).toBe(true);
  });
});

describe('toRatingInput', () => {
  it('converts form data preserving non-zero values', () => {
    const input = toRatingInput({ ...validRating, drinks: 4, hasWifi: true });
    expect(input.drinks).toBe(4);
    expect(input.hasWifi).toBe(true);
    expect(input.wifi).toBe(0);
  });

  it('defaults falsy values to 0', () => {
    const input = toRatingInput(validRating);
    expect(input.drinks).toBe(0);
    expect(input.food).toBe(0);
  });
});
