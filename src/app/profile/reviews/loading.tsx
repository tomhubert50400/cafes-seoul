export default function ReviewsLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="px-0 py-6 space-y-2">
        <div className="h-9 w-40 animate-pulse rounded bg-muted" />
        <div className="h-5 w-64 animate-pulse rounded bg-muted" />
      </div>

      {/* Sort controls skeleton */}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-8 w-28 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
      </div>

      {/* Review card skeletons */}
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
            {/* Author row */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
            {/* Text lines */}
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
            {/* Rating pill */}
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </>
  );
}
