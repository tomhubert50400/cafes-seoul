export default function SubmissionsLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="px-0 py-6 space-y-2">
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="h-5 w-72 animate-pulse rounded bg-muted" />
      </div>

      {/* Tabs skeleton */}
      <div className="mt-4 grid w-full max-w-md grid-cols-3 gap-1 rounded-lg bg-muted p-1">
        <div className="h-10 animate-pulse rounded-md bg-background" />
        <div className="h-10 animate-pulse rounded-md bg-transparent" />
        <div className="h-10 animate-pulse rounded-md bg-transparent" />
      </div>

      {/* Submission card skeletons */}
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
              <div className="space-y-1.5">
                <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
