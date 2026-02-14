'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, AlertCircle, MapPin, Phone, ExternalLink, CheckCircle2, Upload, X, ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';
import { validatePhotoFile, formatFileSize } from '@/lib/photos/validation';
import { processImage } from '@/lib/utils/process-image';
import { createClient } from '@/lib/supabase/client';
import type { SubmissionFormData } from '@/lib/validations/submission';
import type { CafeSummary, TranslatedText } from '@/types/cafe';
import type { SubmissionRateLimit } from '@/types/submission';
import { DuplicateDetectionModal } from './duplicate-detection-modal';
import { RateLimitBlock } from './rate-limit-block';
import { NaverPlaceSearch } from './naver-place-search';
import { HoursInput } from './hours-input';
import { fetchNaverPlaceHours, fetchNaverPlacePhoto, type NaverPlaceSearchResult } from '@/lib/naver/search';
import { getPhotoUrl } from '@/lib/utils/photos';
import type { OperatingHours } from '@/types/cafe';

const MAX_PHOTOS = 3;

export interface CafeSubmissionFormProps {
  /** Callback when form is submitted - returns error object on failure instead of throwing */
  onSubmit: (data: SubmissionFormData) => Promise<{ error: string } | void>;
  /** Callback to check for duplicate cafes */
  onCheckDuplicates: (name: TranslatedText, address: TranslatedText) => Promise<CafeSummary[]>;
  /** Callback to check naver_place_id duplicate */
  onCheckNaverPlaceId?: (id: string) => Promise<{ exists: boolean; foundIn?: string }>;
  /** Rate limit information */
  rateLimit?: SubmissionRateLimit | null;
  /** Loading state */
  isLoading?: boolean;
  /** Form mode - only 'create' is supported now */
  mode?: 'create' | 'edit';
  /** Success callback */
  onSuccess?: () => void;
}

interface SelectedPhoto {
  file: File;
  previewUrl: string;
}

export function CafeSubmissionForm({
  onSubmit,
  onCheckDuplicates,
  onCheckNaverPlaceId,
  rateLimit,
  isLoading = false,
  mode = 'create',
  onSuccess,
}: CafeSubmissionFormProps) {
  const { t } = useI18n();
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicates, setDuplicates] = useState<CafeSummary[]>([]);
  const [pendingData, setPendingData] = useState<SubmissionFormData | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<NaverPlaceSearchResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatingHours, setOperatingHours] = useState<OperatingHours>({});
  const [isFetchingHours, setIsFetchingHours] = useState(false);
  const [naverPhotoPath, setNaverPhotoPath] = useState<string | null>(null);
  const [isFetchingPhoto, setIsFetchingPhoto] = useState(false);
  const [submittedCafeName, setSubmittedCafeName] = useState<string | null>(null);

  // Photo state
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if rate limit has been reached
  const isRateLimited = rateLimit?.remaining === 0;

  const handlePlaceSelect = (place: NaverPlaceSearchResult) => {
    setSelectedPlace(place);
    setError(null);
    setNaverPhotoPath(null);

    // Auto-fetch operating hours from Naver Place
    setIsFetchingHours(true);
    fetchNaverPlaceHours(place.name)
      .then((hours) => {
        if (hours) {
          setOperatingHours(hours as OperatingHours);
        }
      })
      .catch(() => {
        // Silently fail - user can enter hours manually
      })
      .finally(() => setIsFetchingHours(false));

    // Auto-fetch photo from Naver Place (in parallel)
    setIsFetchingPhoto(true);
    fetchNaverPlacePhoto(place.name)
      .then((path) => {
        if (path) {
          setNaverPhotoPath(path);
        }
      })
      .catch(() => {
        // Silently fail - user can upload their own photos
      })
      .finally(() => setIsFetchingPhoto(false));
  };

  // Photo handlers
  const userPhotoLimit = MAX_PHOTOS - (naverPhotoPath ? 1 : 0);

  const handlePhotoSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const errors: string[] = [];
    const newPhotos: SelectedPhoto[] = [];

    const remaining = userPhotoLimit - selectedPhotos.length;
    if (files.length > remaining) {
      errors.push(t('submissions.photos.tooMany').replace('{max}', String(MAX_PHOTOS)));
    }

    const filesToProcess = files.slice(0, remaining);

    for (const file of filesToProcess) {
      const validation = validatePhotoFile(file);
      if (validation.valid) {
        newPhotos.push({
          file,
          previewUrl: URL.createObjectURL(file),
        });
      } else {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`);
      }
    }

    setSelectedPhotos((prev) => [...prev, ...newPhotos]);
    setPhotoErrors(errors);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedPhotos.length, userPhotoLimit, t]);

  const handleRemovePhoto = useCallback((index: number) => {
    setSelectedPhotos((prev) => {
      const photo = prev[index];
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
    setPhotoErrors([]);
  }, []);

  const uploadPhotos = async (): Promise<string[] | null> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError(t('submissions.photos.authRequired'));
      return null;
    }

    setIsUploadingPhotos(true);
    const uploadedPaths: string[] = [];
    const errors: string[] = [];

    for (const photo of selectedPhotos) {
      try {
        const processed = await processImage(photo.file);

        // Upload to submission-photos path
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        const ext = processed.mimeType === 'image/webp' ? 'webp' : 'jpg';
        const path = `submission-photos/${user.id}/${timestamp}-${random}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('cafe-images')
          .upload(path, processed.blob, {
            contentType: processed.mimeType,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          errors.push(`${photo.file.name}: ${uploadError.message}`);
          continue;
        }

        uploadedPaths.push(path);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        errors.push(`${photo.file.name}: ${message}`);
      }
    }

    setIsUploadingPhotos(false);

    if (errors.length > 0) {
      setPhotoErrors(errors);
      return null;
    }

    return uploadedPaths;
  };

  const buildSubmissionData = (place: NaverPlaceSearchResult, userPhotoUrls: string[]): SubmissionFormData => {
    const photoUrls = [...(naverPhotoPath ? [naverPhotoPath] : []), ...userPhotoUrls];
    return {
      name: { ko: place.name },
      address: { ko: place.roadAddress || place.address },
      phone: place.phone || undefined,
      latitude: place.latitude,
      longitude: place.longitude,
      naverPlaceId: place.id,
      operatingHours: Object.keys(operatingHours).length > 0 ? operatingHours : undefined,
      photoUrls,
    };
  };

  const handleSubmit = async () => {
    if (!selectedPlace) {
      setError(t('submissions.form.selectCafeFirst'));
      return;
    }

    if (selectedPhotos.length < MIN_PHOTOS) {
      setError(t('submissions.photos.required'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setPhotoErrors([]);

    try {
      // Check for exact naver_place_id duplicate (blocking)
      if (onCheckNaverPlaceId && selectedPlace.id) {
        const naverResult = await onCheckNaverPlaceId(selectedPlace.id);
        if (naverResult.exists) {
          setError(
            naverResult.foundIn === 'cafes'
              ? t('submissions.duplicateNaver.existsInDirectory')
              : t('submissions.duplicateNaver.alreadySubmitted')
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Upload photos first
      const photoUrls = await uploadPhotos();
      if (!photoUrls) {
        setIsSubmitting(false);
        return;
      }

      const data = buildSubmissionData(selectedPlace, photoUrls);

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
      const result = await onSubmit(data);
      if (result?.error) {
        setError(result.error);
      } else {
        setSubmittedCafeName(selectedPlace.name);
        onSuccess?.();
      }
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
      const result = await onSubmit(pendingData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSubmittedCafeName(selectedPlace?.name || pendingData.name.ko || pendingData.name.en || '');
        setShowDuplicateModal(false);
        setPendingData(null);
        setDuplicates([]);
        onSuccess?.();
      }
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

  const handleSubmitAnother = () => {
    setSubmittedCafeName(null);
    setSelectedPlace(null);
    setOperatingHours({});
    setSelectedPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    setPhotoErrors([]);
    setError(null);
  };

  // Show rate limit block if user has reached their daily limit
  if (isRateLimited && rateLimit) {
    return <RateLimitBlock rateLimit={rateLimit} />;
  }

  // Show success confirmation
  if (submittedCafeName) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{t('submissions.success.submitted')}</h3>
            <p className="text-muted-foreground font-medium">{submittedCafeName}</p>
            <p className="text-sm text-muted-foreground">{t('submissions.success.description')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button asChild variant="outline">
              <Link href="/profile/submissions">{t('submissions.success.viewSubmissions')}</Link>
            </Button>
            <Button onClick={handleSubmitAnother}>
              {t('submissions.success.submitAnother')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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

          {/* Naver Place Search */}
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground/60">
              {t('submissions.form.translationDisclaimer')}
            </p>
            <NaverPlaceSearch
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
                  href={selectedPlace.naverUrl}
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

          {/* Photo Upload Section */}
          {selectedPlace && (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">
                  {t('submissions.photos.title')} <span className="text-destructive">*</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('submissions.photos.description')}
                </p>
              </div>

              {photoErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      {photoErrors.map((err, index) => (
                        <li key={index}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
                disabled={isSubmitting || selectedPhotos.length >= MAX_PHOTOS}
              />

              {/* Photo Previews */}
              {selectedPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {selectedPhotos.map((photo, index) => (
                    <div key={`${photo.file.name}-${index}`} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                      <Image
                        src={photo.previewUrl}
                        alt={photo.file.name}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        disabled={isSubmitting}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/50 text-white text-[10px] truncate">
                        {formatFileSize(photo.file.size)}
                      </div>
                    </div>
                  ))}

                  {/* Add more button */}
                  {selectedPhotos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                      className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {selectedPhotos.length}/{MAX_PHOTOS}
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Empty state - select photos */}
              {selectedPhotos.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-28 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {t('submissions.photos.select')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('submissions.photos.formats')}
                    </span>
                  </div>
                </Button>
              )}
            </div>
          )}

          {/* Operating Hours */}
          {selectedPlace && (
            <HoursInput value={operatingHours} onChange={setOperatingHours} naverMapUrl={selectedPlace.naverUrl} isLoading={isFetchingHours} />
          )}

          {/* Submit Button */}
          <Button
            type="button"
            className="w-full"
            disabled={!selectedPlace || selectedPhotos.length < MIN_PHOTOS || isSubmitting || isLoading || isUploadingPhotos}
            onClick={handleSubmit}
          >
            {isSubmitting || isLoading || isUploadingPhotos ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploadingPhotos ? t('submissions.photos.uploading') : t('submissions.form.submitting')}
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
