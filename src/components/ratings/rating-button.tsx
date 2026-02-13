'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { RatingForm } from './rating-form';
import type { CafeFeatures } from './rating-form';
import type { UserRating } from '@/types/ratings';

interface RatingButtonProps {
  cafeId: string;
  cafeName: string;
  cafeSlug: string;
  existingRating?: UserRating | null;
  cafeFeatures?: CafeFeatures;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onRatingSubmitted?: () => void;
  /** Custom label text for the button */
  label?: string;
  /** When true, navigates to cafe page with ?rate=true instead of opening modal directly */
  redirectToPage?: boolean;
  /** When true, auto-opens modal if ?rate=true is in URL (use on cafe detail page) */
  autoOpenFromUrl?: boolean;
}

export function RatingButton({
  cafeId,
  cafeName,
  cafeSlug,
  existingRating,
  cafeFeatures,
  variant = 'default',
  size = 'default',
  className,
  onRatingSubmitted,
  label,
  redirectToPage = false,
  autoOpenFromUrl = false,
}: RatingButtonProps) {
  const { t } = useI18n();
  const { user, requireAuth } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open modal if ?rate=true is in URL and autoOpenFromUrl is enabled
  useEffect(() => {
    if (autoOpenFromUrl && searchParams.get('rate') === 'true' && user) {
      setIsOpen(true);
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('rate');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [autoOpenFromUrl, searchParams, user]);

  const handleClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent parent Link from triggering
    e.preventDefault();
    e.stopPropagation();

    requireAuth(() => {
      if (redirectToPage) {
        // Navigate to cafe page with rate param
        router.push(`/cafes/${cafeSlug}?rate=true`);
      } else {
        setIsOpen(true);
      }
    });
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
        {label ? (
          <>
            <Star className="h-4 w-4" />
            {label}
          </>
        ) : (
          existingRating ? t('rating.updateButton') : t('rating.rateButton')
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{t('rating.title')}</DialogTitle>
          </DialogHeader>
          {isOpen && (
            <RatingForm
              cafeId={cafeId}
              cafeName={cafeName}
              existingRating={existingRating}
              cafeFeatures={cafeFeatures}
              onSuccess={handleSuccess}
              onCancel={() => setIsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
