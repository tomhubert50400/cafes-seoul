import type { LucideIcon } from 'lucide-react';

interface UserStatsProps {
  icon: LucideIcon;
  title: string;
  count: number;
  metric?: string;
}

export function UserStats({ icon: Icon, title, count, metric }: UserStatsProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold">{count}</p>
          {metric && (
            <span className="text-sm text-muted-foreground">{metric}</span>
          )}
        </div>
      </div>
    </div>
  );
}
