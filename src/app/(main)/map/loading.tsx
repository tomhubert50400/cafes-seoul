import { Loader2 } from 'lucide-react';

export default function MapLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-muted/20">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  );
}
