export function CafeMapSkeleton() {
  return (
    <div className="h-full w-full bg-muted/20 animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 bg-muted rounded-full mx-auto" />
        <p className="mt-2 text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  );
}
