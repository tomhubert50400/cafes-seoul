'use client';

import { useState } from 'react';
import { FILTER_PRESETS } from '@/lib/filter-presets';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Laptop, Heart, Zap, Plus, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Laptop,
  Heart,
  Zap,
};

interface PresetBadgesProps {
  onPresetSelect: (presetId: string) => void;
  matchedPresetId?: string | null;
  className?: string;
}

export function PresetBadges({
  onPresetSelect,
  matchedPresetId,
  className,
}: PresetBadgesProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn('w-full', className)}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors min-h-[44px]"
      >
        {expanded ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        {t('map.presets.title')}
      </button>
      {expanded && (
        <div className="flex flex-wrap gap-2 mt-2">
          {FILTER_PRESETS.map((preset) => {
            const Icon = ICON_MAP[preset.icon];
            const isActive = matchedPresetId === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onPresetSelect(preset.id)}
                aria-pressed={isActive}
                className={cn(
                  'min-h-[44px] px-4 py-2 rounded-full',
                  'border-2 font-medium text-sm transition-colors',
                  'flex items-center gap-2',
                  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-accent'
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{t(preset.labelKey)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
