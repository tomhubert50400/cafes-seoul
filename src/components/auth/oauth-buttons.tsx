'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { loginWithOAuth, type OAuthProvider } from '@/app/actions/auth'
import { openOAuthUrl } from '@/lib/capacitor/auth'

interface OAuthButtonsProps {
  next?: string
  showDivider?: boolean
}

export function OAuthButtons({ next, showDivider = true }: OAuthButtonsProps = {}) {
  const { t } = useI18n()
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setLoadingProvider(provider)
    setError(null)

    try {
      const result = await loginWithOAuth(provider, next)

      if (result.error) {
        setError(result.error)
        setLoadingProvider(null)
        return
      }

      if (result.url) {
        await openOAuthUrl(result.url)
      }
    } catch {
      setError(t('auth.oauth.error.default'))
      setLoadingProvider(null)
    }
  }

  const isLoading = loadingProvider !== null

  return (
    <div className="space-y-3">
      {/* Divider */}
      {showDivider && (
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('auth.oauth.divider')}
            </span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-200"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {/* Kakao button - FIRST (yellow background) */}
      <Button
        type="button"
        variant="outline"
        className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] font-medium border-[#FEE500] hover:border-[#FEE500]/90 transition-all duration-150"
        onClick={() => handleOAuthLogin('kakao')}
        disabled={isLoading}
        aria-busy={loadingProvider === 'kakao'}
      >
        {loadingProvider === 'kakao'
          ? t('auth.oauth.loading')
          : t('auth.oauth.kakao')}
      </Button>

      {/* Google button - SECOND (outline) */}
      <Button
        type="button"
        variant="outline"
        className="w-full transition-all duration-150"
        onClick={() => handleOAuthLogin('google')}
        disabled={isLoading}
        aria-busy={loadingProvider === 'google'}
      >
        {loadingProvider === 'google'
          ? t('auth.oauth.loading')
          : t('auth.oauth.google')}
      </Button>
    </div>
  )
}
