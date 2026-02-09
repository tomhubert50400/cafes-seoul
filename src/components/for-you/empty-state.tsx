'use client';

import Link from 'next/link';
import { Coffee, Dices } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants/routes';

interface EmptyStateProps {
  isAuthenticated: boolean;
}

export function EmptyState({ isAuthenticated }: EmptyStateProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="rounded-full bg-muted p-6">
        <Coffee className="h-10 w-10 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{t('forYou.emptyTitle')}</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          {t('forYou.emptySubtitle')}
        </p>
      </div>

      {!isAuthenticated && (
        <p className="text-sm text-muted-foreground">
          {t('forYou.signUpPrompt')}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href={ROUTES.CAFES}>
            <Coffee className="h-4 w-4 mr-1.5" />
            {t('forYou.browseCafes')}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.ROULETTE}>
            <Dices className="h-4 w-4 mr-1.5" />
            {t('forYou.tryRoulette')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
