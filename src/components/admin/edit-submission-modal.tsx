'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { editSubmission } from '@/lib/actions/admin';
import type { SubmissionWithUser } from '@/types/submission';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditSubmissionModalProps {
  submission: SubmissionWithUser;
  isOpen: boolean;
  onClose: () => void;
  translations: Record<string, string>;
}

const editFormSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameKo: z.string().optional(),
  addressEn: z.string().min(1, 'English address is required'),
  addressKo: z.string().optional(),
  phone: z.string().optional(),
});

type EditFormData = z.infer<typeof editFormSchema>;

export function EditSubmissionModal({
  submission,
  isOpen,
  onClose,
  translations,
}: EditSubmissionModalProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      nameEn: submission.name.en || '',
      nameKo: submission.name.ko || '',
      addressEn: submission.address.en || '',
      addressKo: submission.address.ko || '',
      phone: submission.phone || '',
    },
  });

  const onSubmit = (data: EditFormData) => {
    startTransition(async () => {
      const result = await editSubmission({
        submissionId: submission.id,
        name: {
          en: data.nameEn,
          ko: data.nameKo || '',
        },
        address: {
          en: data.addressEn,
          ko: data.addressKo || '',
        },
        phone: data.phone || null,
      });

      if (result.success) {
        toast.success(translations['admin.success.edited']);
        onClose();
      } else {
        toast.error(result.error || translations['admin.error.generic']);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{translations['admin.edit.title']}</DialogTitle>
          <DialogDescription>
            Edit submission details before approving or rejecting.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameEn">
                  {translations['admin.edit.name']} (EN) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nameEn"
                  {...register('nameEn')}
                  aria-invalid={!!errors.nameEn}
                />
                {errors.nameEn && (
                  <p className="text-sm text-destructive">{errors.nameEn.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameKo">{translations['admin.edit.name']} (KO)</Label>
                <Input id="nameKo" {...register('nameKo')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressEn">
                  {translations['admin.edit.address']} (EN) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="addressEn"
                  {...register('addressEn')}
                  aria-invalid={!!errors.addressEn}
                />
                {errors.addressEn && (
                  <p className="text-sm text-destructive">{errors.addressEn.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressKo">{translations['admin.edit.address']} (KO)</Label>
                <Input id="addressKo" {...register('addressKo')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{translations['admin.edit.phone']}</Label>
              <Input id="phone" {...register('phone')} placeholder="+82-2-XXX-XXXX" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {translations['admin.edit.save']}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
