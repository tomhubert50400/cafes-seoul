'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CafeCard } from '@/components/cafe-card';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants/routes';
import type { CafeSummary } from '@/types/cafe';

interface FeaturedSectionProps {
  cafes: CafeSummary[];
}

export function FeaturedSection({ cafes }: FeaturedSectionProps) {
  const { t } = useI18n();

  if (cafes.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 pb-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('home.featured.title')}</h2>
          <p className="mt-1 text-muted-foreground">{t('home.featured.subtitle')}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={ROUTES.CAFES}>{t('home.featured.viewAll')}</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cafes.map((cafe) => (
          <CafeCard key={cafe.id} cafe={cafe} />
        ))}
      </div>
    </section>
  );
}
