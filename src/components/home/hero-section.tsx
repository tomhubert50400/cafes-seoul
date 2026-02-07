'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dice5 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { POPULAR_NEIGHBORHOODS } from '@/lib/constants/districts';
import { ROUTES } from '@/lib/constants/routes';
import { getLocalizedText } from '@/types/cafe';

export function HeroSection() {
  const { t, language } = useI18n();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-zinc-100 to-background dark:from-zinc-900 dark:to-background">
      <div className="mx-auto max-w-6xl px-4 pt-4 text-center md:pt-8 lg:pt-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          {t('home.hero.title1')} <span className="text-primary">{t('home.hero.title2')}</span>
          <br />
          {t('home.hero.title3')}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          {t('home.hero.subtitle')}
        </p>

        {/* Search bar */}
        <form action={ROUTES.CAFES} method="GET" className="mx-auto mt-8 flex flex-col max-w-xl gap-2 sm:flex-row">
          <Input
            type="search"
            name="q"
            placeholder={t('home.hero.searchPlaceholder')}
            className="h-12 text-base"
          />
          <Button type="submit" size="lg" className="h-12 w-full px-8 sm:w-auto">
            {t('home.hero.search')}
          </Button>
        </form>

        {/* Roulette CTA */}
        <div className="mt-8">
          <Button size="lg" asChild className="h-12 px-8 max-w-full whitespace-normal text-center">
            <Link href={ROUTES.ROULETTE}>
              <Dice5 className="h-4 w-4 shrink-0" />
              <span>{t('home.rouletteCta')}</span>
            </Link>
          </Button>
        </div>

        {/* Popular searches */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 px-2">
          <span className="text-sm text-muted-foreground">{t('home.hero.popular')}</span>
          {POPULAR_NEIGHBORHOODS.slice(0, 6).map((neighborhood) => (
            <Link
              key={neighborhood.slug}
              href={`${ROUTES.CAFES}?neighborhood=${neighborhood.slug}`}
            >
              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                {getLocalizedText(neighborhood.name, language)}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
