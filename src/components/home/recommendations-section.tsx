'use client';

import { CafeCard } from '@/components/cafe-card';
import { useI18n } from '@/lib/i18n';
import { Sparkles } from 'lucide-react';
import type { CafeSummary } from '@/types/cafe';

interface RecommendationsSectionProps {
  cafes: CafeSummary[];
}

export function RecommendationsSection({ cafes }: RecommendationsSectionProps) {
  const { t } = useI18n();

  if (cafes.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">{t('home.recommendations.title')}</h2>
        </div>
        <p className="mt-1 text-muted-foreground">{t('home.recommendations.subtitle')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cafes.map((cafe) => (
          <CafeCard key={cafe.id} cafe={cafe} />
        ))}
      </div>
    </section>
  );
}
