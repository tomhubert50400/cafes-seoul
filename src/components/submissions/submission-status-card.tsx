'use client';

import Link from 'next/link';
import { CafeSubmission } from '@/types/submission';
import { useI18n } from '@/lib/i18n';
import { getLocalizedText } from '@/types/cafe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Pencil, Trash2, ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmissionStatusCardProps {
  submission: CafeSubmission;
  showActions?: boolean;
  showRejectionReason?: boolean;
  isDeleting?: boolean;
  onDelete?: (id: string) => void;
}

export function SubmissionStatusCard({
  submission,
  showActions = false,
  showRejectionReason = false,
  isDeleting = false,
  onDelete,
}: SubmissionStatusCardProps) {
  const { language } = useI18n();
  
  const name = getLocalizedText(submission.name, language);
  const address = getLocalizedText(submission.address, language);
  
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'Pending Review',
    },
    approved: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Approved',
    },
    declined: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Declined',
    },
  };
  
  const config = statusConfig[submission.status];
  const StatusIcon = config.icon;
  
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{name}</h3>
            <p className="text-sm text-muted-foreground truncate">{address}</p>
          </div>
          <div className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border shrink-0',
            config.bgColor,
            config.borderColor
          )}>
            <StatusIcon className={cn('h-3.5 w-3.5', config.color)} />
            <span className={config.color}>{config.label}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>Submitted: {new Date(submission.createdAt).toLocaleDateString()}</span>
          {submission.phone && <span>Phone: {submission.phone}</span>}
        </div>
        
        {/* Rejection reason for declined */}
        {showRejectionReason && submission.status === 'declined' && submission.rejectionReason && (
          <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-3 text-sm">
            <p className="font-medium text-red-800">Reason:</p>
            <p className="text-red-700 mt-1">{submission.rejectionReason}</p>
          </div>
        )}
        
        {/* Actions for pending */}
        {showActions && submission.status === 'pending' && (
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/profile/submissions/${submission.id}/edit`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              onClick={() => onDelete?.(submission.id)}
              disabled={isDeleting}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )}
        
        {/* Link to approved cafe */}
        {submission.status === 'approved' && submission.cafeId && (
          <div className="mt-4">
            <Button variant="link" size="sm" asChild className="px-0 h-auto">
              <Link href={`/cafes/${submission.cafeId}`}>
                View Cafe Page
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
