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
import { deleteCafe } from '@/lib/actions/admin';
import type { AdminCafe } from '@/lib/actions/admin';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteCafeModalProps {
  cafe: AdminCafe;
  isOpen: boolean;
  onClose: () => void;
  translations: Record<string, string>;
}

export function DeleteCafeModal({
  cafe,
  isOpen,
  onClose,
  translations,
}: DeleteCafeModalProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCafe(cafe.id);

      if (result.success) {
        toast.success(translations['admin.delete.success']);
        onClose();
      } else {
        toast.error(result.error || translations['admin.delete.error']);
      }
    });
  };

  const cafeName = cafe.name.en || cafe.name.ko;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            {translations['admin.delete.title']}
          </DialogTitle>
          <DialogDescription>
            Deleting &quot;{cafeName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-md bg-destructive/10 p-4 text-sm">
            <p className="font-medium text-destructive">Warning: This action cannot be undone.</p>
            <p className="mt-2 text-muted-foreground">
              {translations['admin.delete.confirm']}
            </p>
            {cafe.totalRatings > 0 && (
              <p className="mt-2 text-muted-foreground">
                This cafe has <strong>{cafe.totalRatings}</strong> review{cafe.totalRatings !== 1 ? 's' : ''} that will also be deleted.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {translations['common.cancel']}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {translations['common.delete']}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
