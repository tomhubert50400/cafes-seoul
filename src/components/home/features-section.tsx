'use client';

import { useI18n } from '@/lib/i18n';

export function FeaturesSection() {
  const { t } = useI18n();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold">{t('home.features.title')}</h2>
        <p className="mt-1 text-muted-foreground">{t('home.features.subtitle')}</p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <FeatureCard
          icon={<WifiIcon />}
          title={t('home.features.facilities.title')}
          description={t('home.features.facilities.desc')}
        />
        <FeatureCard
          icon={<StarIcon />}
          title={t('home.features.ratings.title')}
          description={t('home.features.ratings.desc')}
        />
        <FeatureCard
          icon={<MapIcon />}
          title={t('home.features.location.title')}
          description={t('home.features.location.desc')}
        />
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function WifiIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h.01" />
      <path d="M2 8.82a15 15 0 0 1 20 0" />
      <path d="M5 12.859a10 10 0 0 1 14 0" />
      <path d="M8.5 16.429a5 5 0 0 1 7 0" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
