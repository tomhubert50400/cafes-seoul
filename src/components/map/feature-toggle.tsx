'use client';

import { Checkbox } from '@/components/ui/checkbox';
import type { LucideIcon } from 'lucide-react';

interface FeatureToggleProps {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function FeatureToggle({
  icon: Icon,
  label,
  checked,
  onChange,
}: FeatureToggleProps) {
  return (
    <div className="flex items-center space-x-3">
      <Checkbox
        id={`feature-${label}`}
        checked={checked}
        onCheckedChange={(checked) => onChange(checked as boolean)}
      />
      <label
        htmlFor={`feature-${label}`}
        className="flex items-center gap-2 text-sm font-normal cursor-pointer"
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </label>
    </div>
  );
}
