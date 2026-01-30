'use client';

import { useState } from 'react';
import { CafeSubmission } from '@/types/submission';
import { SubmissionStatusCard } from './submission-status-card';
import { useI18n } from '@/lib/i18n';
import { deleteSubmission } from '@/lib/actions/submissions';

interface MySubmissionsListProps {
  submissions: CafeSubmission[];
  emptyMessage: string;
  showActions?: boolean;
  showRejectionReason?: boolean;
}

export function MySubmissionsList({
  submissions,
  emptyMessage,
  showActions = false,
  showRejectionReason = false,
}: MySubmissionsListProps) {
  const { t } = useI18n();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <SubmissionStatusCard
          key={submission.id}
          submission={submission}
          showActions={showActions}
          showRejectionReason={showRejectionReason}
          isDeleting={deletingId === submission.id}
          onDelete={async (id) => {
            setDeletingId(id);
            try {
              const result = await deleteSubmission(id);
              if (result.success) {
                // Refresh to show updated list
                window.location.reload();
              }
            } finally {
              setDeletingId(null);
            }
          }}
        />
      ))}
    </div>
  );
}
