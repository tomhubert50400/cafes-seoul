'use client';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface RatingSliderProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
}

export function RatingSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 5,
}: RatingSliderProps) {
  const { t } = useI18n();
  const displayValue = value ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {displayValue > 0 ? (
            <>
              <span className="font-medium text-foreground">{displayValue}</span>
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">+</span>
            </>
          ) : (
            <span className="text-xs">{t('map.filters.any')}</span>
          )}
        </div>
      </div>

      <Slider
        value={[displayValue]}
        onValueChange={([newValue]) => {
          onChange(newValue > 0 ? newValue : null);
        }}
        min={min}
        max={max}
        step={1}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>{t('map.filters.any')}</span>
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5★</span>
      </div>
    </div>
  );
}
