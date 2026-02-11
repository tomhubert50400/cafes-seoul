import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AuthLoading() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded bg-muted mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-10 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      </CardContent>
    </Card>
  );
}
