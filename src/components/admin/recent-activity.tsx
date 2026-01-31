import { Coffee, Image, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ActivityItem {
  id: string;
  type: 'submission' | 'photo';
  action: 'approved' | 'rejected' | 'declined';
  name: string;
  timestamp: string;
}

export interface RecentActivityProps {
  activities: ActivityItem[];
  translations: {
    title: string;
    empty: string;
    approved: string;
    rejected: string;
  };
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  // Fallback to date string for older items
  return date.toLocaleDateString();
}

export function RecentActivity({ activities, translations }: RecentActivityProps) {
  const getActionLabel = (action: ActivityItem['action']) => {
    if (action === 'approved') return translations.approved;
    return translations.rejected;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translations.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            {translations.empty}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const isApproved = activity.action === 'approved';
              const IconType = activity.type === 'submission' ? Coffee : Image;
              const StatusIcon = isApproved ? CheckCircle : XCircle;

              return (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center gap-4"
                >
                  {/* Type icon */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <IconType className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Activity details */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">
                      {activity.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-1.5">
                    <StatusIcon
                      className={`h-4 w-4 ${
                        isApproved ? 'text-green-500' : 'text-red-500'
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        isApproved ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {getActionLabel(activity.action)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
