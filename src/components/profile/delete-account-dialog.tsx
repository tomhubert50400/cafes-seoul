'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { scheduleAccountDeletionAction, cancelAccountDeletionAction } from '@/lib/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Trash2, Undo2 } from 'lucide-react';

interface DeleteAccountDialogProps {
  userEmail: string;
  scheduledDeletionAt: string | null;
  translations: {
    dangerZone: string;
    deleteAccount: string;
    deleteDescription: string;
    deleteWarning: string;
    typeEmail: string;
    emailPlaceholder: string;
    cancel: string;
    confirmDelete: string;
    deleting: string;
    deleteScheduled: string;
    deleteScheduledDescription: string;
    cancelDeletion: string;
    canceling: string;
    deleteSuccess: string;
    deleteError: string;
    cancelSuccess: string;
    cancelError: string;
    emailMismatch: string;
    gracePeriodInfo: string;
  };
}

export function DeleteAccountDialog({
  userEmail,
  scheduledDeletionAt,
  translations: t,
}: DeleteAccountDialogProps) {
  const router = useRouter();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isScheduledForDeletion = !!scheduledDeletionAt;
  const deletionDate = scheduledDeletionAt
    ? new Date(scheduledDeletionAt).toLocaleDateString()
    : null;

  const handleDelete = () => {
    if (confirmEmail !== userEmail) {
      toast.error(t.emailMismatch);
      return;
    }

    startTransition(async () => {
      const result = await scheduleAccountDeletionAction(confirmEmail);

      if (result.success) {
        toast.success(t.deleteSuccess);
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || t.deleteError);
      }
    });
  };

  const handleCancelDeletion = () => {
    startTransition(async () => {
      const result = await cancelAccountDeletionAction();

      if (result.success) {
        toast.success(t.cancelSuccess);
        router.refresh();
      } else {
        toast.error(result.error || t.cancelError);
      }
    });
  };

  // If deletion is scheduled, show cancellation option
  if (isScheduledForDeletion) {
    return (
      <Card className="border-amber-500/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-amber-600">{t.deleteScheduled}</CardTitle>
          </div>
          <CardDescription>
            {t.deleteScheduledDescription.replace('{date}', deletionDate || '')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t.gracePeriodInfo}
          </p>
          <Button
            variant="outline"
            onClick={handleCancelDeletion}
            disabled={isPending}
          >
            <Undo2 className="h-4 w-4 mr-2" />
            {isPending ? t.canceling : t.cancelDeletion}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Normal state: show delete option
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">{t.dangerZone}</CardTitle>
        </div>
        <CardDescription>{t.deleteDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {t.deleteAccount}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {t.deleteAccount}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <span className="block">{t.deleteWarning}</span>
                <span className="block text-sm">{t.gracePeriodInfo}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2 py-4">
              <Label htmlFor="confirm-email">{t.typeEmail}</Label>
              <Input
                id="confirm-email"
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                autoComplete="off"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmEmail('')}>
                {t.cancel}
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending || confirmEmail !== userEmail}
              >
                {isPending ? t.deleting : t.confirmDelete}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
