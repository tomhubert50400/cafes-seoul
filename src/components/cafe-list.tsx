'use client';

import { CafeCard, CafeCardSkeleton } from '@/components/cafe-card';
import { useI18n } from '@/lib/i18n';
import type { CafeSummary } from '@/types/cafe';
import { cn } from '@/lib/utils';

interface CafeListProps {
  cafes: CafeSummary[];
  isLoading?: boolean;
  className?: string;
  favoriteIds?: string[];
  userId?: string;
}

export function CafeList({
  cafes,
  isLoading = false,
  className,
  favoriteIds,
  userId,
}: CafeListProps) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <CafeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (cafes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <EmptyIcon className="h-16 w-16 text-zinc-300 dark:text-zinc-600" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">{t('cafes.noResults')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('cafes.tryAgain')}</p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {cafes.map((cafe) => (
        <CafeCard
          key={cafe.id}
          cafe={cafe}
          isFavorited={favoriteIds?.includes(cafe.id)}
          userId={userId}
        />
      ))}
    </div>
  );
}

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}
