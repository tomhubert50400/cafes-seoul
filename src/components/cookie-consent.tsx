'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { isNativePlatform } from '@/lib/capacitor/platform';

const COOKIE_NAME = 'cookie-consent';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    // Cookie consent is not needed in native app
    if (isNativePlatform()) return;

    const hasConsent = document.cookie
      .split('; ')
      .some((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (!hasConsent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    document.cookie = `${COOKIE_NAME}=accepted; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          {t('cookies.message')}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <a href="/privacy">{t('cookies.learnMore')}</a>
          </Button>
          <Button size="sm" onClick={accept}>
            {t('cookies.accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
