'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { SEOUL_DISTRICTS } from '@/lib/constants/districts';
import { ROUTES } from '@/lib/constants/routes';
import { getLocalizedText } from '@/types/cafe';

export function DistrictsSection() {
  const { t, language } = useI18n();

  return (
    <section className="bg-zinc-50 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold">{t('home.districts.title')}</h2>
          <p className="mt-1 text-muted-foreground">{t('home.districts.subtitle')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {SEOUL_DISTRICTS.map((district) => (
            <Link
              key={district.slug}
              href={`${ROUTES.CAFES}?district=${district.slug}`}
              className="group rounded-lg border bg-card p-4 text-center transition-colors hover:bg-accent"
            >
              <span className="font-medium group-hover:text-accent-foreground">
                {getLocalizedText(district.name, language)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
