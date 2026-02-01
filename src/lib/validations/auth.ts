import { z } from 'zod'

// Username validation regex: alphanumeric, underscores, hyphens, 3-30 chars
const usernameRegex = /^[a-zA-Z0-9_-]+$/

// Factory functions that accept a translation function for i18n support
export const createSignupSchema = (t: (key: string) => string) =>
  z.object({
    username: z
      .string()
      .min(3, t('auth.error.usernameMin'))
      .max(30, t('auth.error.usernameMax'))
      .regex(usernameRegex, t('auth.error.usernameInvalid')),
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
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(usernameRegex, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
