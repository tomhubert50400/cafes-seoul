'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { User, Shield, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SettingsTab = 'profile' | 'security' | 'notifications'

interface SettingsTabsProps {
  activeTab: SettingsTab
  translations: {
    profile: string
    security: string
    notifications: string
  }
}

const tabs: { id: SettingsTab; icon: typeof User }[] = [
  { id: 'profile', icon: User },
  { id: 'security', icon: Shield },
  { id: 'notifications', icon: Bell },
]

export function SettingsTabs({ activeTab, translations }: SettingsTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabClick = (tabId: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.replace(`?${params.toString()}`)
  }

  return (
    <div className="border-t border-b pt-2">
      <nav className="-mb-px flex justify-center gap-x-2 sm:gap-x-8" aria-label="Settings tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const label =
            tab.id === 'profile'
              ? translations.profile
              : tab.id === 'security'
                ? translations.security
                : translations.notifications

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'flex items-center gap-1 sm:gap-2 py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap min-h-[44px]',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
