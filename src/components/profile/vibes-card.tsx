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
import { deleteVibeAction } from '@/lib/actions/vibes';
import { MAX_VIBES } from '@/lib/validations/vibes';
import { getTranslation } from '@/lib/i18n/translations';
import { toast } from 'sonner';
import {
  Sparkles, Coffee, BookOpen, Music, Sun, Moon,
  Leaf, Palette, Camera, Headphones, Laptop, Heart, Zap,
  Plus, Pencil, Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FILTER_PRESETS } from '@/lib/filter-presets';
import { translations } from '@/lib/i18n/translations';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/languages';
import type { UserVibe } from '@/types/vibes';
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
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingVibe, setEditingVibe] = useState<UserVibe | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setModalOpen(true);
  };

  const handleEdit = (vibe: UserVibe) => {
    setModalMode('edit');
    setEditingVibe(vibe);
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

  return (
    <>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{t('vibes.title')}</CardTitle>
          <CardDescription>{t('vibes.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* All vibes - uniform list */}
          <div className="space-y-2">
            {vibes.map((vibe) => {
              const Icon = ICON_MAP[vibe.icon];
              // For default presets, show translated name unless user has customized it
              const preset = vibe.defaultPresetId
                ? FILTER_PRESETS.find((p) => p.id === vibe.defaultPresetId)
                : null;
              let displayName = vibe.name;
              if (preset) {
                const knownTranslations = (Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[])
                  .map((lc) => translations[lc]?.[preset.labelKey])
                  .filter(Boolean);
                if (knownTranslations.includes(vibe.name)) {
                  displayName = t(preset.labelKey);
                }
              }
              return (
                <div
                  key={vibe.id}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {Icon && <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />}
                    <span className="font-medium text-sm truncate">{displayName}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleEdit(vibe)}
                    >
                      <Pencil className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">{t('vibes.edit')}</span>
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

          {/* Create button */}
          <Button
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={handleCreate}
            disabled={vibes.length >= MAX_VIBES}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('vibes.createButton')}
            <span className="ml-2 text-muted-foreground">
              ({vibes.length}/{MAX_VIBES})
            </span>
          </Button>
        </CardContent>
      </Card>

      {/* Vibe Modal */}
      <VibeModal
        mode={modalMode}
        existingVibe={editingVibe}
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
