'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signupSchema, loginSchema } from '@/lib/validations/auth'

type ActionState = {
  message?: string
  errors?: Record<string, string[]>
  showResend?: boolean
  email?: string
}

export async function signup(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState | never> {
  // 1. Validate input with Zod
  const validatedFields = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields',
    }
  }

  const { email, password } = validatedFields.data

  // 2. Call Supabase Auth
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    },
  })

  if (error) {
    return {
      message: error.message,
      errors: {},
    }
  }

  // 3. Redirect on success
  redirect('/?message=Check your email to confirm your account')
}

export async function login(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState | never> {
  // 1. Validate input with Zod
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields',
    }
  }

  const { email, password } = validatedFields.data

  // 2. Call Supabase Auth
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // 3. Map Supabase errors to user-friendly messages
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { message: 'Invalid email or password' }
    }
    if (error.message.includes('Email not confirmed')) {
      return {
        message: 'Please verify your email first',
        showResend: true,
        email,
      }
    }
    return { message: error.message }
  }

  // 4. Success - redirect to home
  redirect('/')
}

export async function logout(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resendVerification(
  email: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// OAuth types
export type OAuthProvider = 'google' | 'kakao'

export type OAuthLoginResult = 
  | { url: string; error?: never }
  | { url?: never; error: string }

/**
 * Initiates OAuth login flow
 * Server Actions cannot redirect to external URLs, so we return the URL for the client to handle
 */
export async function loginWithOAuth(
  provider: OAuthProvider,
  next?: string
): Promise<OAuthLoginResult> {
  const supabase = await createClient()

  // Build redirect URL with optional next param
  const redirectToBase = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
  const redirectTo = next 
    ? `${redirectToBase}?next=${encodeURIComponent(next)}`
    : redirectToBase

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  })

  if (error) {
    // Map specific error codes to user-friendly messages
    if (error.message?.includes('provider_disabled') || error.code === 'provider_disabled') {
      const providerName = provider === 'google' ? 'Google' : 'Kakao'
      return { 
        error: `${providerName} login is temporarily unavailable` 
      }
    }
    
    return { error: 'Unable to start login' }
  }

  if (!data.url) {
    return { error: 'Unable to start login' }
  }

  return { url: data.url }
}
