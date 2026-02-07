import { z } from 'zod';

export const VIBE_ICON_OPTIONS = [
  'Sparkles',
  'Coffee',
  'BookOpen',
  'Music',
  'Sun',
  'Moon',
  'Leaf',
  'Palette',
  'Camera',
  'Headphones',
  'Laptop',
  'Heart',
  'Zap',
] as const;

export const MAX_VIBES = 4;

export const vibeFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(10, 'Name must be at most 10 characters'),
  icon: z.enum(VIBE_ICON_OPTIONS),
  filters: z.record(z.string(), z.unknown()),
});

export type VibeFormData = z.infer<typeof vibeFormSchema>;
