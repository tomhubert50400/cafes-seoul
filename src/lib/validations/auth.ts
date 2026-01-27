import { z } from 'zod'

// Factory functions that accept a translation function for i18n support
export const createSignupSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .min(1, t('auth.error.emailRequired'))
      .email(t('auth.error.emailInvalid')),
    password: z.string().min(8, t('auth.error.passwordMin')),
  })

export const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .min(1, t('auth.error.emailRequired'))
      .email(t('auth.error.emailInvalid')),
    password: z.string().min(1, t('auth.error.passwordRequired')),
  })

// Default schemas with English messages (for server-side validation)
export const signupSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
