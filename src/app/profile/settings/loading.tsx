export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-28 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Form fields skeleton */}
      <div className="rounded-xl border bg-card p-6 space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />

        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          </div>
        ))}

        <div className="h-10 w-20 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
