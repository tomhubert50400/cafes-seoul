'use client';

import { Clock, Coffee, Search, Star } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import type { SubmissionRateLimit } from '@/types/submission';

export interface RateLimitBlockProps {
  /** Rate limit information */
  rateLimit: SubmissionRateLimit;
  /** Optional callback to check again */
  onCheckAgain?: () => void;
}

export function RateLimitBlock({ rateLimit, onCheckAgain }: RateLimitBlockProps) {
  const { t, language } = useI18n();

  // Format the reset time in user's locale
  const resetDate = new Date(rateLimit.resetAt);
  const formattedResetTime = resetDate.toLocaleTimeString(language, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const formattedResetDate = resetDate.toLocaleDateString(language, {
    month: 'short',
    day: 'numeric',
  });

  // Calculate time remaining
  const now = new Date();
  const timeRemaining = resetDate.getTime() - now.getTime();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  let timeRemainingText: string;
  if (hoursRemaining > 0) {
    timeRemainingText = t('submissions.rateLimit.timeRemainingHours')
      .replace('{hours}', String(hoursRemaining))
      .replace('{minutes}', String(minutesRemaining));
  } else if (minutesRemaining > 0) {
    timeRemainingText = t('submissions.rateLimit.timeRemainingMinutes')
      .replace('{minutes}', String(minutesRemaining));
  } else {
    timeRemainingText = t('submissions.rateLimit.timeRemainingSoon');
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl">
          {t('submissions.rateLimit.title')}
        </CardTitle>
        <CardDescription className="text-base">
          {t('submissions.rateLimit.message')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Limit Details */}
        <div className="rounded-lg bg-muted p-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {t('submissions.rateLimit.dailyLimit')}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold">{rateLimit.submissionCount}</span>
            <span className="text-xl text-muted-foreground">/</span>
            <span className="text-xl text-muted-foreground">3</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('submissions.rateLimit.submissionsToday')}
          </p>
        </div>

        {/* Reset Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {t('submissions.rateLimit.resetsAt')}
            </span>
          </div>
          <p className="text-center font-medium">
            {formattedResetDate} {t('submissions.rateLimit.at')} {formattedResetTime}
          </p>
          <p className="text-center text-sm text-muted-foreground">
            ({timeRemainingText})
          </p>
        </div>

        {/* Explanation */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">{t('submissions.rateLimit.whyTitle')}</span>
            {' '}{t('submissions.rateLimit.whyExplanation')}
          </p>
        </div>

        {/* Alternative Actions */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-center">
            {t('submissions.rateLimit.alternativesTitle')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button variant="outline" className="w-full" asChild>
              <a href="/cafes">
                <Search className="mr-2 h-4 w-4" />
                {t('submissions.rateLimit.browseCafes')}
              </a>
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <a href="/map">
                <Coffee className="mr-2 h-4 w-4" />
                {t('submissions.rateLimit.exploreMap')}
              </a>
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <a href="/cafes">
                <Star className="mr-2 h-4 w-4" />
                {t('submissions.rateLimit.rateCafes')}
              </a>
            </Button>
          </div>
        </div>

        {/* Last Submission Info */}
        {rateLimit.lastSubmissionAt && (
          <p className="text-center text-xs text-muted-foreground">
            {t('submissions.rateLimit.lastSubmission')}:{' '}
            {new Date(rateLimit.lastSubmissionAt).toLocaleString(language)}
          </p>
        )}

        {/* Check Again Button (if provided) */}
        {onCheckAgain && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={onCheckAgain}
          >
            {t('submissions.rateLimit.checkAgain')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
