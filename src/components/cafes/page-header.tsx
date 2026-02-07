'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

export function CafesPageHeader() {
  const { t } = useI18n();

  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center w-full">
      <div>
        <h1 className="text-3xl font-bold">{t('cafes.title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('cafes.subtitle')}
        </p>
      </div>
      <Button asChild className="shrink-0">
        <Link href="/submit">
          <Plus className="h-4 w-4 mr-2" />
          {t('cafes.addCafe')}
        </Link>
      </Button>
    </div>
  );
}
