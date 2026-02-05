import { z } from 'zod';

/**
 * Schema for translated text fields
 * Requires at least one of 'en' or 'ko' to have a non-empty value (minimum 2 characters)
 * Other languages (fr, zh, vi) are optional
 */
export const translatedTextSchema = z
  .object({
    en: z.string().min(2).optional(),
    ko: z.string().min(2).optional(),
    fr: z.string().min(2).optional(),
    zh: z.string().min(2).optional(),
    vi: z.string().min(2).optional(),
  })
  .refine(
    (data) => {
      const hasEn = data.en && data.en.length >= 2;
      const hasKo = data.ko && data.ko.length >= 2;
      return hasEn || hasKo;
    },
    {
      message: 'At least one of English or Korean name is required (minimum 2 characters)',
    }
  );

/**
 * Phone number validation regex
 * Supports Korean format (02-1234-5678, 010-1234-5678)
 * and international format (+82-10-1234-5678)
 */
const phoneRegex = /^(\d{2,4}-?\d{3,4}-?\d{4}|\+\d{1,3}-?\d{1,4}-?\d{3,4}-?\d{4})$/;

/**
 * Schema for cafe submission form
 */
export const submissionSchema = z.object({
  name: translatedTextSchema,
  address: translatedTextSchema,
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true;
        return phoneRegex.test(val);
      },
      {
        message: 'Invalid phone number format',
      }
    ),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  districtId: z.number().int().positive().optional(),
  neighborhoodId: z.number().int().positive().optional(),
  kakaoPlaceId: z.string().optional(),
});

/**
 * Type derived from submission schema
 */
export type SubmissionFormData = z.infer<typeof submissionSchema>;

/**
 * Type for translated text
 */
export type TranslatedTextInput = z.infer<typeof translatedTextSchema>;
