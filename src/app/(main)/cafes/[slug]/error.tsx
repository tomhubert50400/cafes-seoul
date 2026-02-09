'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function CafeDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Cafe detail error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-muted/20">
      <div className="text-center max-w-md mx-auto p-6">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load cafe</h2>
        <p className="text-sm text-muted-foreground mb-4">
          There was an error loading this cafe. Please try again.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={reset} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
          <Button onClick={() => (window.location.href = '/')} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
