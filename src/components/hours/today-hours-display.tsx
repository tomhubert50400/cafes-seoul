'use client';

import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { getTodayHours, formatHours, getOrderedDayKeys } from '@/lib/hours';
import type { OperatingHours } from '@/types/cafe';

interface TodayHoursDisplayProps {
  operatingHours?: OperatingHours;
  compact?: boolean;
  expandable?: boolean;
}

export function TodayHoursDisplay({ operatingHours, compact, expandable }: TodayHoursDisplayProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const today = getTodayHours(operatingHours);
  if (!today) return null;

  const todayText = formatHours(today.hours, t('cafe.closed'));

  // Compact mode: just icon + hours text
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{todayText}</span>
      </div>
    );
  }

  // Expandable mode: today + toggle for all days
  if (expandable) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm w-full group"
        >
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{t('cafe.today')}:</span>
          <span className={today.hours ? 'text-foreground' : 'text-muted-foreground'}>
            {todayText}
          </span>
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            {expanded ? (
              <>
                {t('cafe.hideHours')}
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                {t('cafe.showAllHours')}
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </span>
        </button>
        {expanded && (
          <div className="mt-2 space-y-1.5 text-sm pl-6">
            {getOrderedDayKeys().map((day) => {
              const hours = operatingHours![day];
              const isToday = day === today.dayKey;
              return (
                <div
                  key={day}
                  className={`flex justify-between ${isToday ? 'font-medium' : 'text-muted-foreground'}`}
                >
                  <span>{t(`day.${day}`)}</span>
                  <span>{formatHours(hours, t('cafe.closed'))}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Standard mode: "Today: HH:mm - HH:mm"
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span>
        <span className="font-medium">{t('cafe.today')}:</span>{' '}
        {todayText}
      </span>
    </div>
  );
}
