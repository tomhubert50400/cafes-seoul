import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-6xl font-bold text-muted-foreground/30 mb-4">404</div>
        <h2 className="text-lg font-semibold mb-2">Page not found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex justify-center gap-2">
          <Button asChild variant="default">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/cafes">
              <Search className="h-4 w-4 mr-2" />
              Browse cafes
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
