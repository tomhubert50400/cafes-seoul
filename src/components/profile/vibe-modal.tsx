'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RatingSlider } from '@/components/map/rating-slider';
import { FeatureToggle } from '@/components/map/feature-toggle';
import { VIBE_ICON_OPTIONS } from '@/lib/validations/vibes';
import { createVibeAction, updateVibeAction } from '@/lib/actions/vibes';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Sparkles, Coffee, BookOpen, Music, Sun, Moon,
  Leaf, Palette, Camera, Headphones, Laptop, Heart, Zap,
  Wifi, Plug, Dog, Armchair, Car,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserVibe } from '@/types/vibes';
import type { MapFilters, FilterPreset } from '@/types/map';

const ICON_COMPONENT_MAP: Record<string, LucideIcon> = {
  Sparkles, Coffee, BookOpen, Music, Sun, Moon,
  Leaf, Palette, Camera, Headphones, Laptop, Heart, Zap,
};

interface VibeModalProps {
  mode: 'create' | 'edit' | 'customize';
  existingVibe?: UserVibe;
  defaultPreset?: FilterPreset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function VibeModal({
  mode,
  existingVibe,
  defaultPreset,
  open,
  onOpenChange,
  onSuccess,
}: VibeModalProps) {
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [filters, setFilters] = useState<Partial<MapFilters>>({});
  const [saving, setSaving] = useState(false);

  // Reset state every time the modal opens with new data
  useEffect(() => {
    if (!open) return;
    setName(existingVibe?.name || (defaultPreset ? t(defaultPreset.labelKey) : ''));
    setIcon(existingVibe?.icon || defaultPreset?.icon || 'Sparkles');
    setFilters(existingVibe?.filters || defaultPreset?.filters || {});
    setSaving(false);
  }, [open, existingVibe, defaultPreset, t]);

  const updateFilter = <K extends keyof MapFilters>(key: K, value: MapFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    try {
      if (mode === 'edit' && existingVibe) {
        const result = await updateVibeAction(existingVibe.id, {
          name: name.trim(),
          icon,
          filters: filters as Record<string, unknown>,
        });
        if (result.success) {
          toast.success(t('vibes.saveSuccess'));
          onOpenChange(false);
          onSuccess();
        } else {
          toast.error(result.error || t('vibes.saveError'));
        }
      } else {
        const result = await createVibeAction({
          name: name.trim(),
          icon,
          filters: filters as Record<string, unknown>,
          defaultPresetId: mode === 'customize' ? defaultPreset?.id : null,
        });
        if (result.success) {
          toast.success(t('vibes.saveSuccess'));
          onOpenChange(false);
          onSuccess();
        } else {
          toast.error(result.error || t('vibes.saveError'));
        }
      }
    } catch {
      toast.error(t('vibes.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const title =
    mode === 'create'
      ? t('vibes.createTitle')
      : t('vibes.editTitle');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t('vibes.modalDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="vibe-name">{t('vibes.nameLabel')}</Label>
            <Input
              id="vibe-name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 10))}
              placeholder={t('vibes.namePlaceholder')}
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">{name.length}/10</p>
          </div>

          {/* Icon grid */}
          <div className="space-y-2">
            <Label>{t('vibes.iconLabel')}</Label>
            <div className="grid grid-cols-7 gap-2">
              {VIBE_ICON_OPTIONS.map((iconName) => {
                const IconComponent = ICON_COMPONENT_MAP[iconName];
                if (!IconComponent) return null;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={cn(
                      'flex items-center justify-center p-2.5 rounded-lg border-2 transition-colors',
                      'min-h-[44px] min-w-[44px]',
                      icon === iconName
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating Sliders */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {t('map.filters.ratings')}
            </h3>
            <RatingSlider
              label={t('map.filters.seating')}
              value={(filters.seatingMin as number) ?? null}
              onChange={(value) => updateFilter('seatingMin', value)}
            />
            <RatingSlider
              label={t('map.filters.wifi')}
              value={(filters.wifiMin as number) ?? null}
              onChange={(value) => updateFilter('wifiMin', value)}
            />
            <RatingSlider
              label={t('map.filters.food')}
              value={(filters.foodMin as number) ?? null}
              onChange={(value) => updateFilter('foodMin', value)}
            />
            <RatingSlider
              label={t('map.filters.drinks')}
              value={(filters.drinksMin as number) ?? null}
              onChange={(value) => updateFilter('drinksMin', value)}
            />
            <RatingSlider
              label={t('map.filters.lighting')}
              value={(filters.lightingMin as number) ?? null}
              onChange={(value) => updateFilter('lightingMin', value)}
            />
            <RatingSlider
              label={t('map.filters.outlets')}
              value={(filters.outletsMin as number) ?? null}
              onChange={(value) => updateFilter('outletsMin', value)}
            />
            <RatingSlider
              label={t('map.filters.quietness')}
              value={(filters.quietnessMin as number) ?? null}
              onChange={(value) => updateFilter('quietnessMin', value)}
            />
            <RatingSlider
              label={t('map.filters.priceValue')}
              value={(filters.priceValueMin as number) ?? null}
              onChange={(value) => updateFilter('priceValueMin', value)}
            />
            <RatingSlider
              label={t('map.filters.comfort')}
              value={(filters.comfortMin as number) ?? null}
              onChange={(value) => updateFilter('comfortMin', value)}
            />
          </div>

          {/* Feature Toggles */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {t('map.filters.features')}
            </h3>
            <div className="space-y-3">
              <FeatureToggle
                icon={Wifi}
                label={t('map.filters.hasWifi')}
                checked={filters.hasWifi || false}
                onChange={(checked) => updateFilter('hasWifi', checked)}
              />
              <FeatureToggle
                icon={Plug}
                label={t('map.filters.hasPowerOutlets')}
                checked={filters.hasPowerOutlets || false}
                onChange={(checked) => updateFilter('hasPowerOutlets', checked)}
              />
              <FeatureToggle
                icon={Armchair}
                label={t('map.filters.isLaptopFriendly')}
                checked={filters.isLaptopFriendly || false}
                onChange={(checked) => updateFilter('isLaptopFriendly', checked)}
              />
              <FeatureToggle
                icon={Dog}
                label={t('map.filters.isPetFriendly')}
                checked={filters.isPetFriendly || false}
                onChange={(checked) => updateFilter('isPetFriendly', checked)}
              />
              <FeatureToggle
                icon={Car}
                label={t('map.filters.hasParking')}
                checked={filters.hasParking || false}
                onChange={(checked) => updateFilter('hasParking', checked)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('vibes.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? t('vibes.saving') : t('vibes.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
