import { CafeCardSkeleton } from '@/components/cafe-card';

export default function CafesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-9 w-28 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
        </div>

        {/* Roulette CTA skeleton */}
        <div className="mb-6 h-12 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />

        {/* Filters skeleton */}
        <div className="mb-8 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
          ))}
        </div>

        {/* Cafe grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CafeCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
