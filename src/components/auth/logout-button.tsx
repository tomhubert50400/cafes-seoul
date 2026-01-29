'use client'

import { useTransition } from 'react'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { showAuthSuccess } from './auth-toast'

export function LogoutButton() {
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    // Show success toast before logout/redirect
    showAuthSuccess(t('auth.toast.success.logout'), t)

    // Call logout action in transition to allow toast to render
    startTransition(() => {
      logout()
    })
  }

  return (
    <Button 
      type="button" 
      variant="ghost" 
      size="sm"
      disabled={isPending}
      onClick={handleLogout}
    >
      {t('auth.logout')}
    </Button>
  )
}
