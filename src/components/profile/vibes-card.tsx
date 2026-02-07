'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { VibeModal } from './vibe-modal';
import { FILTER_PRESETS } from '@/lib/filter-presets';
import { deleteVibeAction } from '@/lib/actions/vibes';
import { MAX_CUSTOM_VIBES } from '@/lib/validations/vibes';
import { getTranslation } from '@/lib/i18n/translations';
import { toast } from 'sonner';
import {
  Sparkles, Coffee, BookOpen, Music, Sun, Moon,
  Leaf, Palette, Camera, Headphones, Laptop, Heart, Zap,
  Plus, Pencil, RotateCcw, Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserVibe } from '@/types/vibes';
import type { FilterPreset } from '@/types/map';
import type { LanguageCode } from '@/lib/i18n/languages';

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles, Coffee, BookOpen, Music, Sun, Moon,
  Leaf, Palette, Camera, Headphones, Laptop, Heart, Zap,
};

interface VibesCardProps {
  initialVibes: UserVibe[];
  lang: LanguageCode;
}

export function VibesCard({ initialVibes, lang }: VibesCardProps) {
  const t = (key: string) => getTranslation(lang, key);

  const [vibes, setVibes] = useState(initialVibes);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'customize'>('create');
  const [editingVibe, setEditingVibe] = useState<UserVibe | undefined>();
  const [customizePreset, setCustomizePreset] = useState<FilterPreset | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Build override map
  const overrideMap = new Map<string, UserVibe>();
  const customVibes: UserVibe[] = [];
  for (const v of vibes) {
    if (v.defaultPresetId) {
      overrideMap.set(v.defaultPresetId, v);
    } else {
      customVibes.push(v);
    }
  }

  const refreshVibes = useCallback(async () => {
    const { getVibesAction } = await import('@/lib/actions/vibes');
    const result = await getVibesAction();
    if (result.success && result.vibes) {
      setVibes(result.vibes);
    }
  }, []);

  const handleCreate = () => {
    setModalMode('create');
    setEditingVibe(undefined);
    setCustomizePreset(undefined);
    setModalOpen(true);
  };

  const handleEditCustom = (vibe: UserVibe) => {
    setModalMode('edit');
    setEditingVibe(vibe);
    setCustomizePreset(undefined);
    setModalOpen(true);
  };

  const handleCustomizeDefault = (preset: FilterPreset, existingOverride?: UserVibe) => {
    if (existingOverride) {
      setModalMode('edit');
      setEditingVibe(existingOverride);
      setCustomizePreset(undefined);
    } else {
      setModalMode('customize');
      setEditingVibe(undefined);
      setCustomizePreset(preset);
    }
    setModalOpen(true);
  };

  const handleDelete = async (vibeId: string) => {
    setDeleting(true);
    try {
      const result = await deleteVibeAction(vibeId);
      if (result.success) {
        toast.success(t('vibes.deleteSuccess'));
        setDeleteConfirmId(null);
        refreshVibes();
      } else {
        toast.error(result.error || t('vibes.deleteError'));
      }
    } catch {
      toast.error(t('vibes.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const handleReset = async (vibeId: string) => {
    setDeleting(true);
    try {
      const result = await deleteVibeAction(vibeId);
      if (result.success) {
        toast.success(t('vibes.resetSuccess'));
        refreshVibes();
      } else {
        toast.error(result.error || t('vibes.resetError'));
      }
    } catch {
      toast.error(t('vibes.resetError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{t('vibes.title')}</CardTitle>
          <CardDescription>{t('vibes.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Default presets */}
          <div className="space-y-2">
            {FILTER_PRESETS.map((preset) => {
              const override = overrideMap.get(preset.id);
              const Icon = ICON_MAP[override?.icon || preset.icon];
              const displayName = override ? override.name : t(preset.labelKey);

              return (
                <div
                  key={preset.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                    <span className="font-medium text-sm">{displayName}</span>
                    {override && (
                      <span className="text-xs text-muted-foreground">
                        ({t('vibes.customized')})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {override ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleCustomizeDefault(preset, override)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          {t('vibes.edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground"
                          onClick={() => handleReset(override.id)}
                          disabled={deleting}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          {t('vibes.reset')}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleCustomizeDefault(preset)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        {t('vibes.edit')}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom vibes */}
          {customVibes.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              {customVibes.map((vibe) => {
                const Icon = ICON_MAP[vibe.icon];
                return (
                  <div
                    key={vibe.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                      <span className="font-medium text-sm">{vibe.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleEditCustom(vibe)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        {t('vibes.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirmId(vibe.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create button */}
          <Button
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={handleCreate}
            disabled={customVibes.length >= MAX_CUSTOM_VIBES}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('vibes.createButton')}
            {customVibes.length > 0 && (
              <span className="ml-2 text-muted-foreground">
                ({customVibes.length}/{MAX_CUSTOM_VIBES})
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Vibe Modal */}
      <VibeModal
        mode={modalMode}
        existingVibe={editingVibe}
        defaultPreset={customizePreset}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={refreshVibes}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('vibes.deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('vibes.deleteConfirmDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {t('vibes.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleting}
            >
              {t('vibes.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
