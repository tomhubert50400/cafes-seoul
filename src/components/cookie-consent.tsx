'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/lib/i18n';
import { isNativePlatform } from '@/lib/capacitor/platform';
import type { ConsentChoices } from '@/types/analytics';

const COOKIE_NAME = 'cookie-consent';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export function getConsentChoices(): ConsentChoices | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split('=')[1]));
  } catch {
    // Legacy format (just "accepted") — treat as all consented
    return { essential: true, analytics: true, location: true };
  }
}

export function hasAnalyticsConsent(): boolean {
  return getConsentChoices()?.analytics ?? false;
}

export function hasLocationConsent(): boolean {
  return getConsentChoices()?.location ?? false;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [location, setLocation] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    if (isNativePlatform()) return;
    const existing = getConsentChoices();
    if (!existing) {
      setVisible(true);
    }
  }, []);

  const accept = useCallback(() => {
    const choices: ConsentChoices = {
      essential: true,
      analytics,
      location,
    };
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(choices))}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    setVisible(false);
  }, [analytics, location]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm p-4 shadow-lg">
      <div className="mx-auto max-w-4xl space-y-3">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            {t('cookies.message')}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings((s) => !s)}
            >
              {t('cookies.settings')}
            </Button>
            <Button size="sm" onClick={accept}>
              {t('cookies.accept')}
            </Button>
          </div>
        </div>

        {showSettings && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t('cookies.essential')}</p>
                <p className="text-xs text-muted-foreground">{t('cookies.essentialDesc')}</p>
              </div>
              <Switch checked disabled />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t('cookies.analyticsLabel')}</p>
                <p className="text-xs text-muted-foreground">{t('cookies.analyticsDesc')}</p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t('cookies.locationLabel')}</p>
                <p className="text-xs text-muted-foreground">{t('cookies.locationDesc')}</p>
              </div>
              <Switch checked={location} onCheckedChange={setLocation} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
