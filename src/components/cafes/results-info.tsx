'use client';

import { useI18n } from '@/lib/i18n';

interface ResultsInfoProps {
  total: number;
}

export function ResultsInfo({ total }: ResultsInfoProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{total}</span> {t('cafes.total')}
      </p>
    </div>
  );
}
