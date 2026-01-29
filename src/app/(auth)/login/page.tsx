import { LoginPageClient } from './page-client'

interface LoginPageProps {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams
  return <LoginPageClient oauthError={error} message={message} />
}
