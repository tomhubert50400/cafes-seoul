import type { Metadata } from 'next'
import { SignupPageClient } from './page-client'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Seoul Cafe Guide account to rate, review, and save your favorite cafes.',
}

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams
  return <SignupPageClient oauthError={error} />
}
