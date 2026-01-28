import { SignupPageClient } from './page-client'

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams
  return <SignupPageClient oauthError={error} />
}
