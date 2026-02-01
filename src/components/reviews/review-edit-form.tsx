'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { reviewTextSchema, type ReviewTextInput } from '@/lib/validations/reviews';
import { updateReviewTextAction } from '@/lib/actions/reviews';
import { useI18n } from '@/lib/i18n';
import { Save, X } from 'lucide-react';

interface ReviewEditFormProps {
  ratingId: string;
  initialText: string;
  onSave: () => void;
  onCancel: () => void;
}

export function ReviewEditForm({
  ratingId,
  initialText,
  onSave,
  onCancel,
}: ReviewEditFormProps) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ReviewTextInput>({
    resolver: zodResolver(reviewTextSchema),
    defaultValues: {
      reviewText: initialText,
    },
  });

  const reviewTextValue = form.watch('reviewText') || '';
  const charactersRemaining = 500 - reviewTextValue.length;

  const handleSubmit = (data: ReviewTextInput) => {
    startTransition(async () => {
      const result = await updateReviewTextAction(ratingId, data.reviewText || '');

      if (result.success) {
        toast.success(t('reviews.card.reviewSaved'));
        onSave();
      } else {
        toast.error(result.error || t('reviews.card.saveError'));
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Textarea
          {...form.register('reviewText')}
          placeholder={t('reviews.card.reviewPlaceholder')}
          maxLength={500}
          rows={4}
          disabled={isPending}
          className="min-h-[100px] resize-none"
        />
        {reviewTextValue.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            {t('reviews.card.charactersRemaining').replace('{count}', String(charactersRemaining))}
          </p>
        )}
        {form.formState.errors.reviewText && (
          <p className="text-sm text-destructive">
            {form.formState.errors.reviewText.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          <X className="h-4 w-4 mr-1" />
          {t('reviews.card.cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? t('reviews.card.saving') : t('reviews.card.save')}
        </Button>
      </div>
    </form>
  );
}
