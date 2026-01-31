'use client';

import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ApproveSubmissionModal } from './approve-submission-modal';
import { RejectSubmissionModal } from './reject-submission-modal';
import { EditSubmissionModal } from './edit-submission-modal';
import type { SubmissionWithUser } from '@/types/submission';
import { Check, Pencil, X } from 'lucide-react';

interface SubmissionsTableProps {
  submissions: SubmissionWithUser[];
  translations: Record<string, string>;
}

export function SubmissionsTable({ submissions, translations }: SubmissionsTableProps) {
  const [approveModalSubmission, setApproveModalSubmission] =
    useState<SubmissionWithUser | null>(null);
  const [rejectModalSubmission, setRejectModalSubmission] =
    useState<SubmissionWithUser | null>(null);
  const [editModalSubmission, setEditModalSubmission] = useState<SubmissionWithUser | null>(
    null
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations['admin.table.name']}</TableHead>
            <TableHead>{translations['admin.table.address']}</TableHead>
            <TableHead>{translations['admin.table.submitter']}</TableHead>
            <TableHead>{translations['admin.table.date']}</TableHead>
            <TableHead>{translations['admin.table.actions']}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell className="font-medium">
                <div>
                  <div>{submission.name.en || submission.name.ko}</div>
                  {submission.name.ko && submission.name.en && (
                    <div className="text-xs text-muted-foreground">{submission.name.ko}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate">
                  {submission.address.en || submission.address.ko}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {submission.user.displayName || submission.user.email}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(submission.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setApproveModalSubmission(submission)}
                  >
                    <Check className="size-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">
                      {translations['admin.approve.button']}
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditModalSubmission(submission)}
                  >
                    <Pencil className="size-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">
                      {translations['admin.edit.title']}
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRejectModalSubmission(submission)}
                  >
                    <X className="size-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">
                      {translations['admin.reject.button']}
                    </span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Approve Modal */}
      {approveModalSubmission && (
        <ApproveSubmissionModal
          submission={approveModalSubmission}
          isOpen={!!approveModalSubmission}
          onClose={() => setApproveModalSubmission(null)}
          translations={translations}
        />
      )}

      {/* Reject Modal */}
      {rejectModalSubmission && (
        <RejectSubmissionModal
          submission={rejectModalSubmission}
          isOpen={!!rejectModalSubmission}
          onClose={() => setRejectModalSubmission(null)}
          translations={translations}
        />
      )}

      {/* Edit Modal */}
      {editModalSubmission && (
        <EditSubmissionModal
          submission={editModalSubmission}
          isOpen={!!editModalSubmission}
          onClose={() => setEditModalSubmission(null)}
          translations={translations}
        />
      )}
    </>
  );
}
