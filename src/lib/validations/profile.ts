import { z } from 'zod'

// Profile form schema matching CONTEXT.md requirements
export const profileFormSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
    .regex(/^[\w\s\-]+$/u, 'Only letters, numbers, spaces, and hyphens allowed'),
  bio: z
    .string()
    .max(500, 'Bio must be at most 500 characters')
    .optional()
    .or(z.literal('')),
})

// Factory for i18n (follows auth.ts pattern)
export const createProfileFormSchema = (t: (key: string) => string) =>
  z.object({
    display_name: z
      .string()
      .min(2, t('profile.error.displayNameMin'))
      .max(50, t('profile.error.displayNameMax'))
      .regex(/^[\w\s\-]+$/u, t('profile.error.displayNameInvalid')),
    bio: z
      .string()
      .max(500, t('profile.error.bioMax'))
      .optional()
      .or(z.literal('')),
  })

// Avatar file validation (client-side before crop)
export const avatarFileSchema = z
  .custom<File>()
  .refine(
    (file) => file.size <= 5 * 1024 * 1024,
    'File size must be less than 5MB'
  )
  .refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    'Only JPG, PNG, and WebP images are allowed'
  )

export type ProfileFormData = z.infer<typeof profileFormSchema>
