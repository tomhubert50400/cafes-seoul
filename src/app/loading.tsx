export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton (home has its own Header, not from layout) */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <div className="h-6 w-6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="ml-2 hidden md:block h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <div className="mx-auto h-10 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mx-auto mt-4 h-6 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mx-auto mt-8 h-12 w-40 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Featured section skeleton */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 h-7 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border bg-card">
              <div className="aspect-[4/3] animate-pulse bg-zinc-200 dark:bg-zinc-800" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
