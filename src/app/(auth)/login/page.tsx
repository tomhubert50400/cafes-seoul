import { Suspense } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LoginPageClient } from './page-client'

interface LoginPageProps {
  searchParams: Promise<{ error?: string; message?: string }>
}

function LoginPageFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-10 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  )
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageClient oauthError={error} message={message} />
    </Suspense>
  )
}
