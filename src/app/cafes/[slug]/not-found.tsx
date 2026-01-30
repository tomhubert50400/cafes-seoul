'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

export default function CafeNotFound() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-32 text-center">
        <div className="rounded-full bg-zinc-100 p-6 dark:bg-zinc-800">
          <SearchIcon className="h-12 w-12 text-zinc-400" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">{t('notFound.title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('notFound.message')}
        </p>
        <div className="mt-8 flex gap-4">
          <Button asChild>
            <Link href="/cafes">{t('notFound.cafeList')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">{t('notFound.home')}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
