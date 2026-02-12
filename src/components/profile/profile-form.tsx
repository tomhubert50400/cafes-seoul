'use client';

import { useState, useTransition } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { profileFormSchema } from '@/lib/validations/profile';
import { updateProfileAction, uploadAvatarAction } from '@/lib/actions/profile';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { UnsavedChangesWarning } from '@/components/profile/unsaved-changes-warning';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Save, X } from 'lucide-react';
import type { ProfileFormData } from '@/lib/validations/profile';
import type { ProfileWithPrivacy } from '@/types/profile';

interface ProfileFormProps {
  profile: ProfileWithPrivacy;
  avatarUrl: string | null;
  translations: {
    title: string;
    displayName: string;
    displayNamePlaceholder: string;
    bio: string;
    bioPlaceholder: string;
    edit: string;
    save: string;
    cancel: string;
    saving: string;
    saveSuccess: string;
    saveError: string;
    charactersRemaining: string;
  };
}

export function ProfileForm({ profile, avatarUrl, translations: t }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      display_name: profile.display_name || '',
      bio: profile.bio || '',
    },
  });

  const bioValue = form.watch('bio') || '';
  const bioRemaining = 500 - bioValue.length;

  const handleSubmit = async (data: ProfileFormData) => {
    startTransition(async () => {
      const result = await updateProfileAction(data);

      if (result.success) {
        toast.success(t.saveSuccess);
        setIsEditing(false);
        form.reset(data); // Reset form with new values to clear dirty state
      } else {
        toast.error(result.error || t.saveError);
      }
    });
  };

  const handleAvatarCrop = async (blob: Blob) => {
    // Show optimistic preview immediately
    const previewUrl = URL.createObjectURL(blob);
    setCurrentAvatarUrl(previewUrl);

    const formData = new FormData();
    formData.append('avatar', blob, 'avatar.jpg');

    startTransition(async () => {
      const result = await uploadAvatarAction(formData);

      // Clean up preview blob URL
      URL.revokeObjectURL(previewUrl);

      if (result.success && result.avatarUrl) {
        setCurrentAvatarUrl(result.avatarUrl);
        toast.success(t.saveSuccess);
      } else {
        // Revert to original on failure
        setCurrentAvatarUrl(avatarUrl);
        toast.error(result.error || t.saveError);
      }
    });
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  return (
    <FormProvider {...form}>
      <UnsavedChangesWarning />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.title}</CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t.edit}
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Avatar Upload - always clickable */}
            <div className="flex justify-center">
              <AvatarUpload
                currentAvatarUrl={currentAvatarUrl}
                displayName={profile.display_name}
                userId={profile.id}
                onCropComplete={handleAvatarCrop}
              />
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">{t.displayName}</Label>
              {isEditing ? (
                <>
                  <Input
                    id="display_name"
                    {...form.register('display_name')}
                    placeholder={t.displayNamePlaceholder}
                    disabled={isPending}
                  />
                  {form.formState.errors.display_name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.display_name.message}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm py-2">
                  {profile.display_name || '-'}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">{t.bio}</Label>
              {isEditing ? (
                <>
                  <Textarea
                    id="bio"
                    {...form.register('bio')}
                    placeholder={t.bioPlaceholder}
                    maxLength={500}
                    rows={4}
                    disabled={isPending}
                  />
                  {bioValue.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t.charactersRemaining.replace('{count}', String(bioRemaining))}
                    </p>
                  )}
                  {form.formState.errors.bio && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.bio.message}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm py-2 whitespace-pre-wrap">
                  {profile.bio || '-'}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {isPending ? t.saving : t.save}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
