export default function RouletteLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Page content */}
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-4 md:py-8">
          <div className="space-y-6">
            {/* Title */}
            <div className="text-center">
              <div className="mx-auto h-8 w-56 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mx-auto mt-2 h-4 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>

            {/* Filter bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-9 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
            </div>

            {/* Location search */}
            <div className="space-y-2">
              <div className="h-10 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />

              {/* Popular areas */}
              <div className="space-y-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
                  ))}
                  <div className="h-7 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>
            </div>

            {/* Spin button (idle state) */}
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-14 w-14 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-12 w-48 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
