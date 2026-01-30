'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { RatingForm } from './rating-form';
import type { UserRating } from '@/types/ratings';

interface RatingButtonProps {
  cafeId: string;
  cafeName: string;
  cafeSlug: string;
  existingRating?: UserRating | null;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onRatingSubmitted?: () => void;
}

export function RatingButton({
  cafeId,
  cafeName,
  cafeSlug,
  existingRating,
  variant = 'default',
  size = 'default',
  className,
  onRatingSubmitted,
}: RatingButtonProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/cafes/${cafeSlug}`);
      window.location.href = `/login?redirect=${returnUrl}`;
      return;
    }
    setIsOpen(true);
  };

  const handleSuccess = () => {
    setIsOpen(false);
    onRatingSubmitted?.();
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
      >
        {existingRating ? t('rating.updateButton') : t('rating.rateButton')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('rating.title')}</DialogTitle>
          </DialogHeader>
          <RatingForm
            cafeId={cafeId}
            cafeName={cafeName}
            existingRating={existingRating}
            onSuccess={handleSuccess}
            onCancel={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
