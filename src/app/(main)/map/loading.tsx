'use client';

import { Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function MapLoading() {
  const { t } = useI18n();

  return (
    <div className="flex h-[calc(100vh-var(--safe-header-height))] items-center justify-center bg-muted/20">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">{t('common.loadingMap')}</p>
      </div>
    </div>
  );
}
