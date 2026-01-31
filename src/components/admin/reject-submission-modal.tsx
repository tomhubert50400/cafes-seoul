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
import { rejectSubmission } from '@/lib/actions/admin';
import type { SubmissionWithUser } from '@/types/submission';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface RejectSubmissionModalProps {
  submission: SubmissionWithUser;
  isOpen: boolean;
  onClose: () => void;
  translations: Record<string, string>;
}

export function RejectSubmissionModal({
  submission,
  isOpen,
  onClose,
  translations,
}: RejectSubmissionModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleReject = () => {
    // Client-side validation
    if (rejectionReason.length < 10) {
      setError(translations['admin.reject.reasonRequired'] || 'Reason must be at least 10 characters');
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await rejectSubmission({
        submissionId: submission.id,
        rejectionReason,
        adminNotes: adminNotes || undefined,
      });

      if (result.success) {
        toast.success(translations['admin.success.rejected']);
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
          <DialogTitle>{translations['admin.reject.title']}</DialogTitle>
          <DialogDescription>
            Rejecting submission for &quot;{cafeName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">
              {translations['admin.reject.reason']} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (error && e.target.value.length >= 10) {
                  setError(null);
                }
              }}
              placeholder={translations['admin.reject.reasonPlaceholder']}
              rows={3}
              aria-invalid={!!error}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              {rejectionReason.length}/10 characters minimum
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminNotes">{translations['admin.reject.notes']}</Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes (optional)"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {translations['admin.reject.button']}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
