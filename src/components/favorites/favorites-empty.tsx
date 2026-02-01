'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

/**
 * Empty state component for when user has no favorites
 * Shows illustration and CTA to browse cafes
 */
export function FavoritesEmpty() {
  const { t } = useI18n();

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {t('favorites.empty')}
        </h3>
        <p className="text-muted-foreground mb-6">
          {t('favorites.emptyDescription')}
        </p>
        <Button asChild>
          <Link href="/cafes">
            {t('favorites.browseCafes')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
