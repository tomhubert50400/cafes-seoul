'use client';

import { useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteAdminContactMessage } from '@/lib/actions/contact';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { ContactMessageWithUser } from '@/types/contact';

interface DeleteMessageModalProps {
  message: ContactMessageWithUser;
  isOpen: boolean;
  onClose: () => void;
  translations: Record<string, string>;
}

export function DeleteMessageModal({
  message,
  isOpen,
  onClose,
  translations: t,
}: DeleteMessageModalProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAdminContactMessage(message.id);

      if (result.success) {
        toast.success(t['admin.messages.deleted']);
        onClose();
      } else {
        toast.error(result.error || t['admin.messages.error']);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            {t['admin.messages.deleteTitle']}
          </DialogTitle>
          <DialogDescription>
            {t['admin.messages.deleteConfirm']}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium">{message.subject}</p>
            <p className="text-muted-foreground">
              {t['admin.messages.from']}: {message.senderName}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t['common.cancel']}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t['common.delete']}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
