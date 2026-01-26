'use client';

import { useI18n } from '@/lib/i18n';

export function CafesPageHeader() {
  const { t } = useI18n();

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">{t('cafes.title')}</h1>
      <p className="mt-2 text-muted-foreground">
        {t('cafes.subtitle')}
      </p>
    </div>
  );
}
