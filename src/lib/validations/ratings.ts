import { z } from 'zod';

/**
 * Schema for rating form validation
 * Overall rating is mandatory (1-5), all other dimensions default to 0 (skip/not rated)
 */
export const ratingFormSchema = z.object({
  cafeId: z.string().uuid({ message: 'validation.cafeIdInvalid' }),
  // Mandatory overall rating (1-5)
  overall: z.number().int().min(1, { message: 'validation.overallRequired' }).max(5),
  // Optional dimensions (0-5, 0 = not rated) - all have default values
  coffee: z.number().int().min(0).max(5).default(0),
  wifi: z.number().int().min(0).max(5).default(0),
  priceValue: z.number().int().min(0).max(5).default(0),
  quietness: z.number().int().min(0).max(5).default(0),
  seating: z.number().int().min(0).max(5).default(0),
  comfort: z.number().int().min(0).max(5).default(0),
  food: z.number().int().min(0).max(5).default(0),
  petFriendly: z.boolean().default(false),
  lighting: z.number().int().min(0).max(5).default(0),
  outlets: z.number().int().min(0).max(5).default(0),
});

/**
 * Type derived from rating form schema
 * All fields are required (no undefined) because defaults are provided
 */
export type RatingFormData = {
  cafeId: string;
  overall: number;
  coffee: number;
  wifi: number;
  priceValue: number;
  quietness: number;
  seating: number;
  comfort: number;
  food: number;
  petFriendly: boolean;
  lighting: number;
  outlets: number;
};

/**
 * Check if any optional dimensions are rated (non-zero)
 */
export function hasOptionalRatings(data: RatingFormData): boolean {
  return [
    data.coffee,
    data.wifi,
    data.priceValue,
    data.quietness,
    data.seating,
    data.comfort,
    data.food,
    data.lighting,
    data.outlets,
  ].some(v => v > 0) || data.petFriendly;
}

/**
 * Convert form data to database input (ensures 0 defaults)
 */
export function toRatingInput(data: RatingFormData) {
  return {
    cafeId: data.cafeId,
    overall: data.overall,
    coffee: data.coffee || 0,
    wifi: data.wifi || 0,
    priceValue: data.priceValue || 0,
    quietness: data.quietness || 0,
    seating: data.seating || 0,
    comfort: data.comfort || 0,
    food: data.food || 0,
    petFriendly: data.petFriendly,
    lighting: data.lighting || 0,
    outlets: data.outlets || 0,
  };
}
