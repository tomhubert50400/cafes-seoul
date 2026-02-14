'use client';

import { ExternalLink } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { OperatingHours, DayHours } from '@/types/cafe';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

interface HoursInputProps {
  value: OperatingHours;
  onChange: (hours: OperatingHours) => void;
  naverMapUrl?: string;
}

export function HoursInput({ value, onChange, naverMapUrl }: HoursInputProps) {
  const { t } = useI18n();

  const handleDayChange = (day: string, field: 'open' | 'close', val: string) => {
    const current = value[day as keyof OperatingHours] as DayHours | undefined;
    const updated: OperatingHours = {
      ...value,
      [day]: {
        open: current?.open || '',
        close: current?.close || '',
        [field]: val,
      },
    };
    onChange(updated);
  };

  const handleToggleDay = (day: string, addHours: boolean) => {
    if (addHours) {
      onChange({
        ...value,
        [day]: { open: '09:00', close: '22:00' },
      });
    } else {
      const updated = { ...value };
      delete updated[day as keyof OperatingHours];
      onChange(updated);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('submissions.form.hoursLabel')}</label>
      <p className="text-xs text-muted-foreground">{t('submissions.form.hoursHelp')}</p>
      <div className="space-y-2">
        {DAY_KEYS.map((day) => {
          const hours = value[day];
          const hasHours = !!hours;
          return (
            <div key={day} className="flex items-center gap-2 text-sm">
              <span className="w-10 shrink-0 text-muted-foreground">{t(`day.${day}`)}</span>
              <label className="flex items-center gap-1.5 shrink-0">
                <input
                  type="checkbox"
                  checked={hasHours}
                  onChange={(e) => handleToggleDay(day, e.target.checked)}
                  className="rounded border-input"
                />
              </label>
              {hasHours && (
                <>
                  <input
                    type="time"
                    value={hours?.open || ''}
                    onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="time"
                    value={hours?.close || ''}
                    onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
