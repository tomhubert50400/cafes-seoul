'use client';

import Link from 'next/link';
import { Dice5 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants/routes';

export function RouletteCta({ translationKey }: { translationKey: string }) {
  const { t } = useI18n();

  return (
    <Link
      href={ROUTES.ROULETTE}
      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-dashed border-muted-foreground/25 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/25 transition-colors"
    >
      <Dice5 className="h-4 w-4" />
      <span>{t(translationKey)}</span>
    </Link>
  );
}
