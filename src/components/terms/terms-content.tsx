'use client';

import { useI18n } from '@/lib/i18n';

export function TermsContent() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{t('terms.title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('terms.updated')}</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('terms.acceptance.title')}</h2>
          <p className="text-muted-foreground">{t('terms.acceptance.text')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('terms.service.title')}</h2>
          <p className="text-muted-foreground">{t('terms.service.text')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('terms.accounts.title')}</h2>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
            <li>{t('terms.accounts.accurate')}</li>
            <li>{t('terms.accounts.security')}</li>
            <li>{t('terms.accounts.age')}</li>
            <li>{t('terms.accounts.one')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('terms.userContent.title')}</h2>
          <p className="text-muted-foreground">{t('terms.userContent.intro')}</p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
            <li>{t('terms.userContent.own')}</li>
            <li>{t('terms.userContent.rights')}</li>
            <li>{t('terms.userContent.license')}</li>
            <li>{t('terms.userContent.retain')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('terms.conduct.title')}</h2>
          <p className="text-muted-foreground">{t('terms.conduct.intro')}</p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
            <li>{t('terms.conduct.false')}</li>
            <li>{t('terms.conduct.harass')}</li>
            <li>{t('terms.conduct.illegal')}</li>
            <li>{t('terms.conduct.manipulate')}</li>
            <li>{t('terms.conduct.scrape')}</li>
            <li>{t('terms.conduct.interfere')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('terms.cafeInfo.title')}</h2>
          <p className="text-muted-foreground">{t('terms.cafeInfo.text')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('terms.moderation.title')}</h2>
          <p className="text-muted-foreground">{t('terms.moderation.text')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('terms.liability.title')}</h2>
          <p className="text-muted-foreground">{t('terms.liability.text')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('terms.termination.title')}</h2>
          <p className="text-muted-foreground">{t('terms.termination.text')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">{t('terms.changes.title')}</h2>
          <p className="text-muted-foreground">{t('terms.changes.text')}</p>
        </section>
      </div>
    </div>
  );
}
