export default function CafeDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Breadcrumb skeleton */}
        <nav className="mb-4 flex items-center gap-2">
          <div className="h-4 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </nav>

        {/* Image gallery skeleton */}
        <div className="mb-8 overflow-hidden rounded-xl">
          <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2">
            {/* Main large image */}
            <div className="aspect-square md:col-span-2 md:row-span-2 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            {/* Side images (desktop only) */}
            <div className="hidden md:block aspect-square animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="hidden md:block aspect-square animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="hidden md:block aspect-square animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="hidden md:block aspect-square animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 order-1">
            {/* Title */}
            <div className="mb-6">
              <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              {/* Rating */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-5 w-5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                  ))}
                </div>
                <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>

            {/* Tabs skeleton */}
            <div className="mt-8">
              <div className="flex gap-2 border-b pb-2">
                <div className="h-8 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-8 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>

              {/* Description skeleton */}
              <div className="mt-6 space-y-8">
                <div>
                  <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-4 w-4/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                </div>

                {/* Rating breakdown skeleton */}
                <div>
                  <div className="h-5 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 mb-3" />
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                        <div className="h-3 flex-1 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 order-2">
            {/* Location card skeleton */}
            <div className="rounded-xl border bg-card p-6">
              <div className="h-5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
              {/* Map placeholder */}
              <div className="mt-4 h-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              {/* Action buttons */}
              <div className="mt-4 flex gap-2">
                <div className="h-9 flex-1 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-9 flex-1 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>

            {/* Amenities card skeleton */}
            <div className="rounded-xl border bg-card p-6">
              <div className="h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 mb-4" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-7 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
