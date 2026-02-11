export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero section skeleton */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-100 to-background dark:from-zinc-900 dark:to-background">
        <div className="mx-auto max-w-6xl px-4 pt-4 text-center md:pt-8 lg:pt-12">
          {/* Title */}
          <div className="mx-auto h-10 w-80 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 md:h-12 md:w-[28rem]" />
          <div className="mx-auto mt-2 h-10 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 md:h-12 md:w-64" />
          {/* Subtitle */}
          <div className="mx-auto mt-6 h-5 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 md:w-96" />

          {/* Search bar */}
          <div className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
            <div className="h-12 flex-1 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-12 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700 sm:w-28" />
          </div>

          {/* Roulette CTA */}
          <div className="mt-8 flex justify-center">
            <div className="h-12 w-56 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
          </div>

          {/* Popular tags */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 px-2">
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
            ))}
          </div>
        </div>
      </section>

      {/* Featured section skeleton */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-7 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="mt-1 h-4 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border bg-card">
              <div className="aspect-[4/3] animate-pulse bg-zinc-200 dark:bg-zinc-800" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="mt-2 flex gap-1">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-5 w-12 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features section skeleton */}
      <section className="mx-auto max-w-6xl px-4 pt-2 pb-16">
        <div className="mb-12 text-center">
          <div className="mx-auto h-7 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mx-auto mt-1 h-4 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="mx-auto mt-4 h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mx-auto mt-2 h-4 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
