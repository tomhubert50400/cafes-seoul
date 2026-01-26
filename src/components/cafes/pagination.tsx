'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface PaginationProps {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | number | boolean | undefined>;
}

export function Pagination({ page, totalPages, searchParams }: PaginationProps) {
  const { t } = useI18n();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      {page > 1 && (
        <Button variant="outline" asChild>
          <Link
            href={{
              pathname: '/cafes',
              query: { ...searchParams, page: page - 1 },
            }}
          >
            {t('cafes.prev')}
          </Link>
        </Button>
      )}

      <span className="px-4 text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>

      {page < totalPages && (
        <Button variant="outline" asChild>
          <Link
            href={{
              pathname: '/cafes',
              query: { ...searchParams, page: page + 1 },
            }}
          >
            {t('cafes.next')}
          </Link>
        </Button>
      )}
    </div>
  );
}
