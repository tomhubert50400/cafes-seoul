'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { approveSubmission } from '@/lib/actions/admin';
import type { SubmissionWithUser } from '@/types/submission';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ApproveSubmissionModalProps {
  submission: SubmissionWithUser;
  isOpen: boolean;
  onClose: () => void;
  translations: Record<string, string>;
}

export function ApproveSubmissionModal({
  submission,
  isOpen,
  onClose,
  translations,
}: ApproveSubmissionModalProps) {
  const [adminNotes, setAdminNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveSubmission({
        submissionId: submission.id,
        adminNotes: adminNotes || undefined,
      });

      if (result.success) {
        toast.success(translations['admin.success.approved']);
        onClose();
      } else {
        toast.error(result.error || translations['admin.error.generic']);
      }
    });
  };

  const cafeName = submission.name.en || submission.name.ko;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translations['admin.approve.title']}</DialogTitle>
          <DialogDescription>
            {translations['admin.approve.confirm']}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-medium">{cafeName}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {submission.address.en || submission.address.ko}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminNotes">{translations['admin.approve.notes']}</Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes (optional)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleApprove}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {translations['admin.approve.button']}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
