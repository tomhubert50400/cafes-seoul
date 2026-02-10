'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, MapPin, Phone, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';
import type { SubmissionFormData } from '@/lib/validations/submission';
import type { CafeSummary, TranslatedText } from '@/types/cafe';
import type { SubmissionRateLimit } from '@/types/submission';
import { DuplicateDetectionModal } from './duplicate-detection-modal';
import { RateLimitBlock } from './rate-limit-block';
import { KakaoPlaceSearch } from './kakao-place-search';
import { HoursInput } from './hours-input';
import type { KakaoPlaceSearchResult } from '@/lib/kakao/geocode';
import type { OperatingHours } from '@/types/cafe';

export interface CafeSubmissionFormProps {
  /** Callback when form is submitted */
  onSubmit: (data: SubmissionFormData) => Promise<void>;
  /** Callback to check for duplicate cafes */
  onCheckDuplicates: (name: TranslatedText, address: TranslatedText) => Promise<CafeSummary[]>;
  /** Callback to check kakao_place_id duplicate */
  onCheckKakaoPlaceId?: (id: string) => Promise<{ exists: boolean; foundIn?: string }>;
  /** Rate limit information */
  rateLimit?: SubmissionRateLimit | null;
  /** Loading state */
  isLoading?: boolean;
  /** Form mode - only 'create' is supported now */
  mode?: 'create' | 'edit';
  /** Success callback */
  onSuccess?: () => void;
}

export function CafeSubmissionForm({
  onSubmit,
  onCheckDuplicates,
  onCheckKakaoPlaceId,
  rateLimit,
  isLoading = false,
  mode = 'create',
  onSuccess,
}: CafeSubmissionFormProps) {
  const { t } = useI18n();
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicates, setDuplicates] = useState<CafeSummary[]>([]);
  const [pendingData, setPendingData] = useState<SubmissionFormData | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlaceSearchResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if rate limit has been reached
  const isRateLimited = rateLimit?.remaining === 0;

  const handlePlaceSelect = (place: KakaoPlaceSearchResult) => {
    setSelectedPlace(place);
    setError(null);
  };

  const buildSubmissionData = (place: KakaoPlaceSearchResult): SubmissionFormData => ({
    name: { ko: place.name },
    address: { ko: place.roadAddress || place.address },
    phone: place.phone || undefined,
    latitude: place.latitude,
    longitude: place.longitude,
    kakaoPlaceId: place.id,
  });

  const handleSubmit = async () => {
    if (!selectedPlace) {
      setError(t('submissions.form.selectCafeFirst'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data = buildSubmissionData(selectedPlace);

      // Check for exact kakao_place_id duplicate (blocking)
      if (onCheckKakaoPlaceId && data.kakaoPlaceId) {
        const kakaoResult = await onCheckKakaoPlaceId(data.kakaoPlaceId);
        if (kakaoResult.exists) {
          setError(
            kakaoResult.foundIn === 'cafes'
              ? t('submissions.duplicateKakao.existsInDirectory')
              : t('submissions.duplicateKakao.alreadySubmitted')
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Check for fuzzy duplicates before submitting
      const potentialDuplicates = await onCheckDuplicates(data.name, data.address);

      if (potentialDuplicates.length > 0) {
        setDuplicates(potentialDuplicates);
        setPendingData(data);
        setShowDuplicateModal(true);
        setIsSubmitting(false);
        return;
      }

      // No duplicates, proceed with submission
      await onSubmit(data);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit cafe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmProceed = async () => {
    if (!pendingData) return;

    setIsSubmitting(true);
    try {
      await onSubmit(pendingData);
      setShowDuplicateModal(false);
      setPendingData(null);
      setDuplicates([]);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit cafe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateModal(false);
    setPendingData(null);
    setDuplicates([]);
  };

  // Show rate limit block if user has reached their daily limit
  if (isRateLimited && rateLimit) {
    return <RateLimitBlock rateLimit={rateLimit} />;
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {t('submissions.form.title')}
          </CardTitle>
          <CardDescription>
            {t('submissions.form.searchSubtitle')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {rateLimit && rateLimit.remaining > 0 && (
            <Alert variant="default" className="bg-muted">
              <AlertDescription>
                {rateLimit.remaining === 1
                  ? t('submissions.rateLimit.remainingOne')
                  : t('submissions.rateLimit.remainingMany').replace('{count}', String(rateLimit.remaining))}
              </AlertDescription>
            </Alert>
          )}

          {/* Kakao Place Search */}
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground/60">
              {t('submissions.form.translationDisclaimer')}
            </p>
            <KakaoPlaceSearch
              onSelect={handlePlaceSelect}
              placeholder={t('submissions.form.searchPlaceholder')}
            />
          </div>

          {/* Selected Place Details */}
          {selectedPlace && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-lg">{selectedPlace.name}</h3>
                <a
                  href={selectedPlace.kakaoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{selectedPlace.roadAddress || selectedPlace.address}</span>
                </div>
                {selectedPlace.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{selectedPlace.phone}</span>
                  </div>
                )}
              </div>

              {selectedPlace.category && (
                <div className="text-xs text-muted-foreground">
                  {selectedPlace.category}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="button"
            className="w-full"
            disabled={!selectedPlace || isSubmitting || isLoading}
            onClick={handleSubmit}
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('submissions.form.submitting')}
              </>
            ) : (
              t('submissions.form.submitButton')
            )}
          </Button>

          {!selectedPlace && (
            <p className="text-xs text-center text-muted-foreground">
              {t('submissions.form.selectToSubmit')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Duplicate Detection Modal */}
      <DuplicateDetectionModal
        isOpen={showDuplicateModal}
        onClose={handleCancelDuplicate}
        duplicates={duplicates}
        onConfirmProceed={handleConfirmProceed}
        onCancel={handleCancelDuplicate}
        submittedName={pendingData?.name || {}}
        submittedAddress={pendingData?.address || {}}
      />
    </>
  );
}
