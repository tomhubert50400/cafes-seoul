'use client';

import Link from 'next/link';
import { Dice5 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants/routes';

export function RouletteCta({ translationKey }: { translationKey: string }) {
  const { t } = useI18n();

  return (
    <Button asChild className="shrink-0">
      <Link href={ROUTES.ROULETTE}>
        <Dice5 className="h-4 w-4" />
        {t(translationKey)}
      </Link>
    </Button>
  );
}
