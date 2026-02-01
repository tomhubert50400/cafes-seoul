'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { toggleNotificationPreference } from '@/lib/actions/notifications'
import { NotificationType, NOTIFICATION_TYPES } from '@/lib/types/notifications'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Bell } from 'lucide-react'

interface NotificationsSectionProps {
  initialPreferences: Record<NotificationType, boolean>
  translations: {
    title: string
    description: string
    cafeApproved: string
    cafeApprovedDesc: string
    cafeRejected: string
    cafeRejectedDesc: string
    photoApproved: string
    photoApprovedDesc: string
    photoRejected: string
    photoRejectedDesc: string
    updateSuccess: string
    updateError: string
  }
}

type NotificationConfig = {
  type: NotificationType
  labelKey: keyof Pick<
    NotificationsSectionProps['translations'],
    'cafeApproved' | 'cafeRejected' | 'photoApproved' | 'photoRejected'
  >
  descKey: keyof Pick<
    NotificationsSectionProps['translations'],
    | 'cafeApprovedDesc'
    | 'cafeRejectedDesc'
    | 'photoApprovedDesc'
    | 'photoRejectedDesc'
  >
}

const NOTIFICATION_CONFIG: NotificationConfig[] = [
  { type: 'cafe_approved', labelKey: 'cafeApproved', descKey: 'cafeApprovedDesc' },
  { type: 'cafe_rejected', labelKey: 'cafeRejected', descKey: 'cafeRejectedDesc' },
  { type: 'photo_approved', labelKey: 'photoApproved', descKey: 'photoApprovedDesc' },
  { type: 'photo_rejected', labelKey: 'photoRejected', descKey: 'photoRejectedDesc' },
]

export function NotificationsSection({
  initialPreferences,
  translations: t,
}: NotificationsSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [preferences, setPreferences] =
    useState<Record<NotificationType, boolean>>(initialPreferences)
  const [updatingType, setUpdatingType] = useState<NotificationType | null>(null)

  const handleToggle = (type: NotificationType, checked: boolean) => {
    // Optimistically update UI
    setPreferences((prev) => ({ ...prev, [type]: checked }))
    setUpdatingType(type)

    startTransition(async () => {
      const result = await toggleNotificationPreference(type, checked)

      if (result.success) {
        toast.success(t.updateSuccess, { duration: 2000 })
      } else {
        // Revert on error
        setPreferences((prev) => ({ ...prev, [type]: !checked }))
        toast.error(result.error || t.updateError)
      }

      setUpdatingType(null)
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <CardTitle>{t.title}</CardTitle>
        </div>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {NOTIFICATION_CONFIG.map((config, index) => (
          <div key={config.type}>
            <div className="flex items-center justify-between">
              <Label
                htmlFor={`notification-${config.type}`}
                className="flex flex-col gap-1 cursor-pointer"
              >
                <span className="font-medium">{t[config.labelKey]}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {t[config.descKey]}
                </span>
              </Label>
              <Switch
                id={`notification-${config.type}`}
                checked={preferences[config.type]}
                onCheckedChange={(checked) => handleToggle(config.type, checked)}
                disabled={isPending && updatingType === config.type}
              />
            </div>
            {index < NOTIFICATION_CONFIG.length - 1 && (
              <div className="border-b mt-4" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
