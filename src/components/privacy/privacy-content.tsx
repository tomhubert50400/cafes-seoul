'use client';

import { useI18n } from '@/lib/i18n';

export function PrivacyContent() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{t('privacy.title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('privacy.updated')}</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('privacy.collect.title')}</h2>
          <p className="text-muted-foreground">{t('privacy.collect.intro')}</p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
            <li>{t('privacy.collect.account')}</li>
            <li>{t('privacy.collect.content')}</li>
            <li>{t('privacy.collect.usage')}</li>
            <li>{t('privacy.collect.device')}</li>
            <li>{t('privacy.collect.location')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('privacy.use.title')}</h2>
          <p className="text-muted-foreground">{t('privacy.use.intro')}</p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
            <li>{t('privacy.use.improve')}</li>
            <li>{t('privacy.use.display')}</li>
            <li>{t('privacy.use.notify')}</li>
            <li>{t('privacy.use.map')}</li>
            <li>{t('privacy.use.analyze')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('privacy.sharing.title')}</h2>
          <p className="text-muted-foreground">{t('privacy.sharing.text')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('privacy.storage.title')}</h2>
          <p className="text-muted-foreground">{t('privacy.storage.text')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('privacy.cookies.title')}</h2>
          <p className="text-muted-foreground">{t('privacy.cookies.text')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('privacy.yourRights.title')}</h2>
          <p className="text-muted-foreground">{t('privacy.yourRights.intro')}</p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
            <li>{t('privacy.yourRights.access')}</li>
            <li>{t('privacy.yourRights.correct')}</li>
            <li>{t('privacy.yourRights.delete')}</li>
            <li>{t('privacy.yourRights.optout')}</li>
            <li>{t('privacy.yourRights.withdraw')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('privacy.changes.title')}</h2>
          <p className="text-muted-foreground">{t('privacy.changes.text')}</p>
        </section>
      </div>
    </div>
  );
}
