'use client'

import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

export function LogoutButton() {
  const { t } = useI18n()

  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm">
        {t('auth.logout')}
      </Button>
    </form>
  )
}
