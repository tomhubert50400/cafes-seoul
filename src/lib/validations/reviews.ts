import { z } from 'zod';

/**
 * Schema for review text validation
 * - Optional text up to 500 characters
 * - Empty string allowed (for deletion)
 */
export const reviewTextSchema = z.object({
  reviewText: z
    .string()
    .max(500, 'Review must be 500 characters or less')
    .optional()
    .or(z.literal('')),
});

export type ReviewTextInput = z.infer<typeof reviewTextSchema>;

/**
 * Schema for rating ID validation (used in vote actions)
 */
export const ratingIdSchema = z.object({
  ratingId: z.string().uuid('Invalid rating ID'),
});

export type RatingIdInput = z.infer<typeof ratingIdSchema>;
