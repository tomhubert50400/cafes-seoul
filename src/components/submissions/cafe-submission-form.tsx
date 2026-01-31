'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Phone, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';
import { submissionSchema, SubmissionFormData } from '@/lib/validations/submission';
import type { CafeSummary, TranslatedText } from '@/types/cafe';
import type { SubmissionRateLimit } from '@/types/submission';
import { DuplicateDetectionModal } from './duplicate-detection-modal';
import { RateLimitBlock } from './rate-limit-block';

export interface CafeSubmissionFormProps {
  /** Callback when form is submitted */
  onSubmit: (data: SubmissionFormData) => Promise<void>;
  /** Callback to check for duplicate cafes */
  onCheckDuplicates: (name: TranslatedText, address: TranslatedText) => Promise<CafeSummary[]>;
  /** Rate limit information */
  rateLimit?: SubmissionRateLimit | null;
  /** Loading state */
  isLoading?: boolean;
  /** Initial data for edit mode */
  initialData?: Partial<SubmissionFormData>;
  /** Form mode */
  mode?: 'create' | 'edit';
  /** Success callback */
  onSuccess?: () => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: 'Korean' },
  { code: 'fr', label: 'French' },
  { code: 'zh', label: 'Chinese' },
  { code: 'vi', label: 'Vietnamese' },
] as const;

export function CafeSubmissionForm({
  onSubmit,
  onCheckDuplicates,
  rateLimit,
  isLoading = false,
  initialData,
  mode = 'create',
  onSuccess,
}: CafeSubmissionFormProps) {
  const { t } = useI18n();
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicates, setDuplicates] = useState<CafeSummary[]>([]);
  const [pendingData, setPendingData] = useState<SubmissionFormData | null>(null);
  const [activeLanguageTab, setActiveLanguageTab] = useState<'en' | 'ko'>('en');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: initialData?.name || { en: '', ko: '' },
      address: initialData?.address || { en: '', ko: '' },
      phone: initialData?.phone || '',
      districtId: initialData?.districtId,
      neighborhoodId: initialData?.neighborhoodId,
    },
  });

  // Check if rate limit has been reached
  const isRateLimited = rateLimit?.remaining === 0;

  const handleFormSubmit = async (data: SubmissionFormData) => {
    try {
      // Check for duplicates before submitting
      const potentialDuplicates = await onCheckDuplicates(data.name, data.address);

      if (potentialDuplicates.length > 0) {
        setDuplicates(potentialDuplicates);
        setPendingData(data);
        setShowDuplicateModal(true);
        return;
      }

      // No duplicates, proceed with submission
      await onSubmit(data);
      onSuccess?.();
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Failed to submit cafe',
      });
    }
  };

  const handleConfirmProceed = async () => {
    if (!pendingData) return;

    try {
      await onSubmit(pendingData);
      setShowDuplicateModal(false);
      setPendingData(null);
      setDuplicates([]);
      onSuccess?.();
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Failed to submit cafe',
      });
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
            {mode === 'create' ? t('submissions.form.title') : t('submissions.form.updateTitle')}
          </CardTitle>
          <CardDescription>{t('submissions.form.subtitle')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {errors.root && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.root.message}</AlertDescription>
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

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Cafe Name Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  {t('submissions.form.nameLabel')}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {t('submissions.form.requiredLanguages')}
                </span>
              </div>

              <Tabs value={activeLanguageTab} onValueChange={(v) => setActiveLanguageTab(v as 'en' | 'ko')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en">{t('submissions.form.englishTab')}</TabsTrigger>
                  <TabsTrigger value="ko">{t('submissions.form.koreanTab')}</TabsTrigger>
                </TabsList>

                <TabsContent value="en" className="mt-2">
                  <Controller
                    name="name.en"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder={t('submissions.form.namePlaceholderEn')}
                        className={errors.name ? 'border-destructive' : ''}
                      />
                    )}
                  />
                </TabsContent>

                <TabsContent value="ko" className="mt-2">
                  <Controller
                    name="name.ko"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder={t('submissions.form.namePlaceholderKo')}
                        className={errors.name ? 'border-destructive' : ''}
                      />
                    )}
                  />
                </TabsContent>
              </Tabs>

              {/* Optional languages */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {LANGUAGES.slice(2).map((lang) => (
                  <Controller
                    key={lang.code}
                    name={`name.${lang.code}` as `name.${typeof lang.code}`}
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{lang.label}</Label>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder={t(`submissions.form.namePlaceholder${lang.code.toUpperCase()}` as const)}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  />
                ))}
              </div>

              {errors.name && (
                <p className="text-sm text-destructive">{t('submissions.form.nameRequired')}</p>
              )}
            </div>

            {/* Address Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  {t('submissions.form.addressLabel')}
                  <span className="text-destructive ml-1">*</span>
                </Label>
              </div>

              <Tabs defaultValue="en">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en">{t('submissions.form.englishTab')}</TabsTrigger>
                  <TabsTrigger value="ko">{t('submissions.form.koreanTab')}</TabsTrigger>
                </TabsList>

                <TabsContent value="en" className="mt-2">
                  <Controller
                    name="address.en"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder={t('submissions.form.addressPlaceholderEn')}
                        className={errors.address ? 'border-destructive' : ''}
                      />
                    )}
                  />
                </TabsContent>

                <TabsContent value="ko" className="mt-2">
                  <Controller
                    name="address.ko"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder={t('submissions.form.addressPlaceholderKo')}
                        className={errors.address ? 'border-destructive' : ''}
                      />
                    )}
                  />
                </TabsContent>
              </Tabs>

              {/* Optional languages */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {LANGUAGES.slice(2).map((lang) => (
                  <Controller
                    key={lang.code}
                    name={`address.${lang.code}` as `address.${typeof lang.code}`}
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{lang.label}</Label>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder={t(`submissions.form.addressPlaceholder${lang.code.toUpperCase()}` as const)}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  />
                ))}
              </div>

              {errors.address && (
                <p className="text-sm text-destructive">{t('submissions.form.addressRequired')}</p>
              )}
            </div>

            {/* Phone Section */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-medium">
                {t('submissions.form.phoneLabel')}
                <span className="text-muted-foreground ml-1 font-normal">
                  ({t('submissions.form.optional')})
                </span>
              </Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      id="phone"
                      value={field.value || ''}
                      placeholder={t('submissions.form.phonePlaceholder')}
                      className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                    />
                  </div>
                )}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
              <p className="text-xs text-muted-foreground">{t('submissions.form.phoneHelp')}</p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create'
                    ? t('submissions.form.submitting')
                    : t('submissions.form.updating')}
                </>
              ) : mode === 'create' ? (
                t('submissions.form.submitButton')
              ) : (
                t('submissions.form.updateButton')
              )}
            </Button>
          </form>
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
