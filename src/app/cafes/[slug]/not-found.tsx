import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';

export default function CafeNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-32 text-center">
        <div className="rounded-full bg-zinc-100 p-6 dark:bg-zinc-800">
          <SearchIcon className="h-12 w-12 text-zinc-400" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">카페를 찾을 수 없습니다</h1>
        <p className="mt-2 text-muted-foreground">
          요청하신 카페가 존재하지 않거나 삭제되었을 수 있습니다.
        </p>
        <div className="mt-8 flex gap-4">
          <Button asChild>
            <Link href="/cafes">카페 목록으로</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">홈으로</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
