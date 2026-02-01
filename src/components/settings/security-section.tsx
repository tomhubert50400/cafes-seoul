'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { requestPasswordReset } from '@/lib/actions/password'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Shield, Mail, Info } from 'lucide-react'

interface SecuritySectionProps {
  hasPasswordAuth: boolean
  userEmail: string
  translations: {
    changePassword: string
    changePasswordDescription: string
    sendResetLink: string
    resetLinkSent: string
    noPasswordForOAuth: string
  }
}

export function SecuritySection({
  hasPasswordAuth,
  userEmail,
  translations: t,
}: SecuritySectionProps) {
  const [isPending, startTransition] = useTransition()
  const [hasSent, setHasSent] = useState(false)

  const handleSendResetLink = () => {
    startTransition(async () => {
      await requestPasswordReset(userEmail)
      setHasSent(true)
      toast.success(t.resetLinkSent, { duration: 2000 })
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <CardTitle>{t.changePassword}</CardTitle>
        </div>
        <CardDescription>{t.changePasswordDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasPasswordAuth ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{userEmail}</span>
            </div>
            <Button
              onClick={handleSendResetLink}
              disabled={isPending || hasSent}
              variant="outline"
            >
              {hasSent ? t.resetLinkSent : t.sendResetLink}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            <span>{t.noPasswordForOAuth}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
