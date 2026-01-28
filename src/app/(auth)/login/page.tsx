import { LoginPageClient } from './page-client'

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams
  return <LoginPageClient oauthError={error} />
}
