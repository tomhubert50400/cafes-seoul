'use client';

import { Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function ProfileLoading() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">{t('common.loadingProfile')}</p>
      </div>
    </div>
  );
}
