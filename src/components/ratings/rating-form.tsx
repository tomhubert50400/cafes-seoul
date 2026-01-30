'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { ratingFormSchema, RatingFormData, toRatingInput } from '@/lib/validations/ratings';
import { submitRating } from '@/lib/actions/ratings';
import type { UserRating } from '@/types/ratings';
import { Star, Loader2 } from 'lucide-react';
import { useState } from 'react';

export interface RatingFormProps {
  cafeId: string;
  cafeName: string;
  existingRating?: UserRating | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * RatingForm - A comprehensive rating form with sliders for 10 dimensions
 * 
 * Features:
 * - Mandatory overall rating (1-5)
 * - Optional dimensions with sliders (0-5, 0 = skip)
 * - Pet-friendly toggle
 * - Three organized sections: Essentials, Comfort, Extras
 * - Update mode support (pre-populates existing data)
 * - Mobile-optimized with touch-friendly sliders
 * - Full i18n support
 */
export function RatingForm({
  cafeId,
  cafeName,
  existingRating,
  onSuccess,
  onCancel,
}: RatingFormProps) {
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isUpdateMode = !!existingRating;

  // Prepare default values based on existing rating or empty defaults
  const defaultValues: RatingFormData = existingRating
    ? {
        cafeId,
        overall: existingRating.overall,
        drinks: existingRating.drinks,
        wifi: existingRating.wifi,
        priceValue: existingRating.priceValue,
        quietness: existingRating.quietness,
        seating: existingRating.seating,
        comfort: existingRating.comfort,
        food: existingRating.food,
        petFriendly: existingRating.petFriendly,
        lighting: existingRating.lighting,
        outlets: existingRating.outlets,
      }
    : {
        cafeId,
        overall: 0,
        drinks: 0,
        wifi: 0,
        priceValue: 0,
        quietness: 0,
        seating: 0,
        comfort: 0,
        food: 0,
        petFriendly: false,
        lighting: 0,
        outlets: 0,
      };

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(ratingFormSchema),
    defaultValues,
  });

  const overallValue = watch('overall');

  async function handleFormSubmit(data: RatingFormData) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitRating(data);

      if (result.success) {
        onSuccess?.();
      } else {
        setSubmitError(result.error || t('rating.submitError'));
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setSubmitError(t('rating.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Render a star rating input for overall rating
  const StarRatingInput = ({
    value,
    onChange,
    error,
  }: {
    value: number;
    onChange: (value: number) => void;
    error?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          {t('rating.overall')}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <span className="text-sm font-medium">
          {value > 0 ? (
            <span className="flex items-center gap-1 text-amber-500">
              {value} <Star className="h-4 w-4 fill-current" />
            </span>
          ) : (
            <span className="text-muted-foreground">{t('rating.required')}</span>
          )}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-2 transition-colors hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded ${
              star <= value
                ? 'text-amber-500'
                : 'text-muted-foreground/30 hover:text-amber-300'
            }`}
            aria-label={`${t('rating.rate')} ${star}`}
          >
            <Star
              className={`h-8 w-8 ${star <= value ? 'fill-current' : ''} transition-all`}
            />
          </button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-destructive">{t(error)}</p>
      )}
    </div>
  );

  // Render a slider for numeric dimensions
  const DimensionSlider = ({
    name,
    label,
    value,
    onChange,
  }: {
    name: string;
    label: string;
    value: number | undefined;
    onChange: (value: number) => void;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm text-muted-foreground min-w-[3rem] text-right">
          {value === 0 ? t('rating.skip') : value}
        </span>
      </div>
      <Slider
        min={0}
        max={5}
        step={1}
        value={[value ?? 0]}
        onValueChange={(vals) => onChange(vals[0])}
        className="cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{t('rating.skip')}</span>
        <span>{t('rating.excellent')}</span>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">
          {isUpdateMode ? t('rating.updateTitle') : t('rating.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {cafeName}
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Overall Rating - Mandatory */}
          <div className="pb-4 border-b">
            <Controller
              name="overall"
              control={control}
              render={({ field }) => (
                <StarRatingInput
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.overall?.message}
                />
              )}
            />
          </div>

          {/* Section: Essentials */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              {t('rating.essentials')}
            </h3>
            
            <Controller
              name="drinks"
              control={control}
              render={({ field }) => (
                <DimensionSlider
                  name="drinks"
                  label={t('rating.drinks')}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              name="wifi"
              control={control}
              render={({ field }) => (
                <DimensionSlider
                  name="wifi"
                  label={t('rating.wifi')}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              name="priceValue"
              control={control}
              render={({ field }) => (
                <DimensionSlider
                  name="priceValue"
                  label={t('rating.priceValue')}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Section: Comfort */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              {t('rating.comfort')}
            </h3>
            
            <Controller
              name="quietness"
              control={control}
              render={({ field }) => (
                <DimensionSlider
                  name="quietness"
                  label={t('rating.quietness')}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              name="seating"
              control={control}
              render={({ field }) => (
                <DimensionSlider
                  name="seating"
                  label={t('rating.seating')}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              name="comfort"
              control={control}
              render={({ field }) => (
                <DimensionSlider
                  name="comfort"
                  label={t('rating.comfort')}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Section: Extras */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              {t('rating.extras')}
            </h3>
            
            <Controller
              name="food"
              control={control}
              render={({ field }) => (
                <DimensionSlider
                  name="food"
                  label={t('rating.food')}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              name="lighting"
              control={control}
              render={({ field }) => (
                <DimensionSlider
                  name="lighting"
                  label={t('rating.lighting')}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              name="outlets"
              control={control}
              render={({ field }) => (
                <DimensionSlider
                  name="outlets"
                  label={t('rating.outlets')}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            {/* Pet Friendly Toggle */}
            <Controller
              name="petFriendly"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-lg border p-4 mt-4">
                  <div>
                    <Label className="font-medium">{t('rating.petFriendly')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('rating.petFriendlyDescription')}
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || overallValue === 0}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : isUpdateMode ? (
                t('rating.update')
              ) : (
                t('rating.submit')
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
