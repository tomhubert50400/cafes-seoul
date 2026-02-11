import { CafeCardSkeleton } from '@/components/cafe-card';

export default function FavoritesLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="px-0 py-6 space-y-2">
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="h-5 w-72 animate-pulse rounded bg-muted" />
      </div>

      {/* Grid of cafe card skeletons */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <CafeCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
