'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants/routes';

export function CtaSection() {
  const { t } = useI18n();

  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">{t('home.cta.title')}</h2>
        <p className="mx-auto mt-2 max-w-xl text-primary-foreground/80">
          {t('home.cta.subtitle')}
        </p>
        <Button variant="secondary" size="lg" className="mt-6" asChild>
          <Link href={ROUTES.SIGNUP}>{t('home.cta.button')}</Link>
        </Button>
      </div>
    </section>
  );
}
