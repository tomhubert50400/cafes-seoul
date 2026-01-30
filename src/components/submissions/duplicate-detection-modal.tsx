'use client';

import { AlertTriangle, MapPin, Star, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import type { CafeSummary, TranslatedText } from '@/types/cafe';
import { getLocalizedText } from '@/types/cafe';

export interface DuplicateDetectionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** List of potential duplicate cafes */
  duplicates: CafeSummary[];
  /** Callback when user confirms to proceed despite duplicates */
  onConfirmProceed: () => void;
  /** Callback when user cancels submission */
  onCancel: () => void;
  /** The name the user submitted */
  submittedName: TranslatedText;
  /** The address the user submitted */
  submittedAddress: TranslatedText;
}

export function DuplicateDetectionModal({
  isOpen,
  onClose,
  duplicates,
  onConfirmProceed,
  onCancel,
  submittedName,
  submittedAddress,
}: DuplicateDetectionModalProps) {
  const { t, language } = useI18n();

  const handleProceed = () => {
    onConfirmProceed();
  };

  const handleCancel = () => {
    onCancel();
  };

  const displayName = getLocalizedText(submittedName, language);
  const displayAddress = getLocalizedText(submittedAddress, language);

  // Limit to top 5 matches
  const topDuplicates = duplicates.slice(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {t('submissions.duplicates.title')}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {t('submissions.duplicates.description')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-4">
          {/* Submitted Entry Callout */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('submissions.duplicates.submittedEntry')}
            </p>
            <div className="space-y-1">
              <p className="font-medium">{displayName || t('submissions.duplicates.unnamed')}</p>
              {displayAddress && (
                <p className="text-sm text-muted-foreground flex items-start gap-1">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {displayAddress}
                </p>
              )}
            </div>
          </div>

          {/* Duplicates List */}
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {t('submissions.duplicates.potentialMatches')}
            </p>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {topDuplicates.map((cafe) => (
                  <DuplicateCafeCard key={cafe.id} cafe={cafe} />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Warning Message */}
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-medium">{t('submissions.duplicates.warning')}</span>
              {' '}{t('submissions.duplicates.warningDetail')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              {t('submissions.duplicates.cancelButton')}
            </Button>
            <Button
              onClick={handleProceed}
              variant="default"
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
            >
              {t('submissions.duplicates.proceedButton')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DuplicateCafeCardProps {
  cafe: CafeSummary;
}

function DuplicateCafeCard({ cafe }: DuplicateCafeCardProps) {
  const { t, language } = useI18n();
  
  const name = getLocalizedText(cafe.name, language);
  const address = getLocalizedText(cafe.address, language);

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* Image Placeholder */}
      <div className="shrink-0">
        {cafe.primaryImageUrl ? (
          <img
            src={cafe.primaryImageUrl}
            alt={name}
            className="h-16 w-16 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{name}</h4>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {cafe.cafeType}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          {address}
        </p>

        <div className="flex items-center gap-3 pt-1">
          {/* Rating */}
          {cafe.totalRatings > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{cafe.overallRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">
                ({cafe.totalRatings} {t('submissions.duplicates.reviews')})
              </span>
            </div>
          )}

          {/* Price Range */}
          <span className="text-xs text-muted-foreground">
            {'₩'.repeat(cafe.priceRange)}
          </span>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {cafe.hasWifi && (
            <Badge variant="outline" className="text-xs">
              {t('feature.wifi')}
            </Badge>
          )}
          {cafe.hasPowerOutlets && (
            <Badge variant="outline" className="text-xs">
              {t('feature.outlets')}
            </Badge>
          )}
          {cafe.isPetFriendly && (
            <Badge variant="outline" className="text-xs">
              {t('feature.pet')}
            </Badge>
          )}
          {cafe.hasParking && (
            <Badge variant="outline" className="text-xs">
              {t('feature.parking')}
            </Badge>
          )}
        </div>
      </div>

      {/* View Link */}
      <a
        href={`/cafes/${cafe.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 p-2 rounded-md hover:bg-accent transition-colors"
        title={t('submissions.duplicates.viewCafe')}
      >
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </a>
    </div>
  );
}
