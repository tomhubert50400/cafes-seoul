'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { ROUTES } from '@/lib/constants/routes'
import { resendVerification } from '@/app/actions/auth'
import { showAuthSuccess, showAuthError } from '@/components/auth/auth-toast'

interface VerifyEmailPageClientProps {
  email?: string
}

export function VerifyEmailPageClient({ email }: VerifyEmailPageClientProps) {
  const { t } = useI18n()
  const [isResending, setIsResending] = useState(false)

  const handleResend = async () => {
    if (!email || isResending) return

    setIsResending(true)
    try {
      const result = await resendVerification(email)
      if (result.success) {
        showAuthSuccess(t('auth.toast.success.resend'), t)
      } else if (result.error) {
        showAuthError(result.error, t)
      }
    } catch {
      showAuthError(t('common.error'), t)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6 pb-6 space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/20">
            <Mail className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Title and Message */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('auth.verify.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('auth.verify.message')}
          </p>
        </div>

        {/* Email Display */}
        {email ? (
          <div className="text-center">
            <p className="font-medium text-lg bg-muted rounded-lg py-2 px-4 inline-block max-w-full break-all">
              {email}
            </p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>{t('common.error')}</p>
          </div>
        )}

        {/* Instructions */}
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.verify.instructions')}
        </p>

        {/* Spam hint */}
        <p className="text-center text-xs text-muted-foreground/70">
          {t('auth.verify.checkSpam')}
        </p>

        {/* Resend Button */}
        {email && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('auth.verify.resend')}
              </>
            ) : (
              t('auth.verify.resend')
            )}
          </Button>
        )}

        {/* Back Link */}
        <p className="text-sm text-center text-muted-foreground">
          <Link 
            href={ROUTES.SIGNUP} 
            className="text-primary hover:underline"
          >
            {t('auth.verify.back')}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
