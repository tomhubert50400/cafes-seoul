import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/profiles';
import { syncProfileFromAuthMetadata } from '@/lib/actions/profile';
import { ProfileForm } from '@/components/profile/profile-form';
import { PrivacyToggle } from '@/components/profile/privacy-toggle';
import { DeleteAccountDialog } from '@/components/profile/delete-account-dialog';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { ROUTES } from '@/lib/constants/routes';

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN + '?next=/profile/settings');
  }

  // Sync OAuth data to profile if missing (for OAuth users)
  await syncProfileFromAuthMetadata();

  const [profile, lang] = await Promise.all([
    getProfile(supabase, user.id),
    getLanguageFromCookies(),
  ]);

  if (!profile) {
    // Profile should exist (created on signup), but handle edge case
    redirect(ROUTES.PROFILE);
  }

  // Get avatar URL if exists
  // Handle both storage paths (uploaded) and full URLs (OAuth)
  let avatarUrl: string | null = null;
  if (profile.avatar_url) {
    // Check if it's already a full URL (OAuth avatar)
    if (profile.avatar_url.startsWith('http://') || profile.avatar_url.startsWith('https://')) {
      avatarUrl = profile.avatar_url;
    } else {
      // It's a storage path, get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(profile.avatar_url);
      avatarUrl = data.publicUrl;
    }
  }

  const translations = {
    title: getTranslation(lang, 'settings.profileInfo'),
    displayName: getTranslation(lang, 'settings.displayName'),
    displayNamePlaceholder: getTranslation(lang, 'settings.displayNamePlaceholder'),
    bio: getTranslation(lang, 'settings.bio'),
    bioPlaceholder: getTranslation(lang, 'settings.bioPlaceholder'),
    edit: getTranslation(lang, 'settings.edit'),
    save: getTranslation(lang, 'settings.save'),
    cancel: getTranslation(lang, 'settings.cancel'),
    saving: getTranslation(lang, 'settings.saving'),
    saveSuccess: getTranslation(lang, 'settings.saveSuccess'),
    saveError: getTranslation(lang, 'settings.saveError'),
    charactersRemaining: getTranslation(lang, 'settings.charactersRemaining'),
  };

  const privacyTranslations = {
    title: getTranslation(lang, 'settings.privacy'),
    description: getTranslation(lang, 'settings.privacyDescription'),
    publicLabel: getTranslation(lang, 'settings.publicLabel'),
    privateLabel: getTranslation(lang, 'settings.privateLabel'),
    updating: getTranslation(lang, 'settings.updating'),
    updateSuccess: getTranslation(lang, 'settings.privacyUpdateSuccess'),
    updateError: getTranslation(lang, 'settings.privacyUpdateError'),
  };

  const deletionTranslations = {
    dangerZone: getTranslation(lang, 'settings.dangerZone'),
    deleteAccount: getTranslation(lang, 'settings.deleteAccount'),
    deleteDescription: getTranslation(lang, 'settings.deleteDescription'),
    deleteWarning: getTranslation(lang, 'settings.deleteWarning'),
    typeEmail: getTranslation(lang, 'settings.typeEmail'),
    emailPlaceholder: getTranslation(lang, 'settings.emailPlaceholder'),
    cancel: getTranslation(lang, 'settings.cancel'),
    confirmDelete: getTranslation(lang, 'settings.confirmDelete'),
    deleting: getTranslation(lang, 'settings.deleting'),
    deleteScheduled: getTranslation(lang, 'settings.deleteScheduled'),
    deleteScheduledDescription: getTranslation(lang, 'settings.deleteScheduledDescription'),
    cancelDeletion: getTranslation(lang, 'settings.cancelDeletion'),
    canceling: getTranslation(lang, 'settings.canceling'),
    deleteSuccess: getTranslation(lang, 'settings.deleteSuccess'),
    deleteError: getTranslation(lang, 'settings.deleteError'),
    cancelSuccess: getTranslation(lang, 'settings.cancelSuccess'),
    cancelError: getTranslation(lang, 'settings.cancelError'),
    emailMismatch: getTranslation(lang, 'settings.emailMismatch'),
    gracePeriodInfo: getTranslation(lang, 'settings.gracePeriodInfo'),
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <ProfileForm
        profile={profile}
        avatarUrl={avatarUrl}
        translations={translations}
      />
      <PrivacyToggle
        isPrivate={profile.is_private ?? false}
        translations={privacyTranslations}
      />
      <DeleteAccountDialog
        userEmail={user.email || ''}
        scheduledDeletionAt={profile.scheduled_deletion_at}
        translations={deletionTranslations}
      />
    </div>
  );
}
