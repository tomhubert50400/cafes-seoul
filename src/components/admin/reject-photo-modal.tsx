'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { rejectPhoto } from '@/lib/actions/admin';
import type { PendingPhoto } from '@/lib/actions/admin';

interface RejectPhotoModalProps {
  photo: PendingPhoto | null;
  onClose: () => void;
}

export function RejectPhotoModal({ photo, onClose }: RejectPhotoModalProps) {
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleReject = () => {
    if (!photo) return;
    if (reason.length < 5) {
      toast.error('Rejection reason must be at least 5 characters');
      return;
    }

    startTransition(async () => {
      const result = await rejectPhoto(photo.id, reason);
      if (result.success) {
        toast.success('Photo rejected');
        setReason('');
        onClose();
      } else {
        toast.error(result.error || 'Failed to reject photo');
      }
    });
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={!!photo} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Photo</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this photo. This will be visible to the
            uploader.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter rejection reason (min 5 characters)..."
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {reason.length}/5 characters minimum
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isPending || reason.length < 5}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              'Reject Photo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
