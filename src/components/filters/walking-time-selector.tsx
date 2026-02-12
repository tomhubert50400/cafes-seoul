'use client';

import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { WALKING_MINUTES_OPTIONS, type WalkingMinutes } from '@/types/metro';

interface WalkingTimeSelectorProps {
  value: WalkingMinutes;
  onChange: (minutes: WalkingMinutes) => void;
}

export function WalkingTimeSelector({ value, onChange }: WalkingTimeSelectorProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground shrink-0">{t('metro.walkingTime')}</span>
      <div className="flex gap-1">
        {WALKING_MINUTES_OPTIONS.map((minutes) => (
          <button
            key={minutes}
            onClick={() => onChange(minutes)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
              value === minutes
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            )}
          >
            {minutes} {t('metro.minuteWalk')}
          </button>
        ))}
      </div>
    </div>
  );
}
