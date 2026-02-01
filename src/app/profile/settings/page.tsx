import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/profiles';
import { getNotificationPreferences } from '@/lib/supabase/notifications';
import { hasPasswordAuth, getUserEmail } from '@/lib/supabase/auth-helpers';
import { syncProfileFromAuthMetadata } from '@/lib/actions/profile';
import { ProfileForm } from '@/components/profile/profile-form';
import { PrivacyToggle } from '@/components/profile/privacy-toggle';
import { DeleteAccountDialog } from '@/components/profile/delete-account-dialog';
import { NotificationsSection } from '@/components/settings/notifications-section';
import { SettingsTabs, SettingsTab } from '@/components/settings/settings-tabs';
import { SecuritySection } from '@/components/settings/security-section';
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

interface SettingsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN + '?next=/profile/settings');
  }

  // Sync OAuth data to profile if missing (for OAuth users)
  await syncProfileFromAuthMetadata();

  // Parse active tab from URL query params
  const params = await searchParams;
  const validTabs: SettingsTab[] = ['profile', 'security', 'notifications'];
  const activeTab: SettingsTab = validTabs.includes(params.tab as SettingsTab)
    ? (params.tab as SettingsTab)
    : 'profile';

  const [profile, lang, notificationPreferences, hasPassword, userEmail] = await Promise.all([
    getProfile(supabase, user.id),
    getLanguageFromCookies(),
    getNotificationPreferences(supabase, user.id),
    hasPasswordAuth(supabase),
    getUserEmail(supabase),
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

  // Tab translations
  const tabTranslations = {
    profile: getTranslation(lang, 'settings.tabProfile'),
    security: getTranslation(lang, 'settings.tabSecurity'),
    notifications: getTranslation(lang, 'settings.tabNotifications'),
  };

  const profileFormTranslations = {
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

  const securityTranslations = {
    changePassword: getTranslation(lang, 'settings.changePassword'),
    changePasswordDescription: getTranslation(lang, 'settings.changePasswordDescription'),
    sendResetLink: getTranslation(lang, 'settings.sendResetLink'),
    resetLinkSent: getTranslation(lang, 'settings.resetLinkSent'),
    noPasswordForOAuth: getTranslation(lang, 'settings.noPasswordForOAuth'),
  };

  const notificationTranslations = {
    title: getTranslation(lang, 'settings.notificationsTitle'),
    description: getTranslation(lang, 'settings.notificationsDescription'),
    cafeApproved: getTranslation(lang, 'settings.cafeApproved'),
    cafeApprovedDesc: getTranslation(lang, 'settings.cafeApprovedDesc'),
    cafeRejected: getTranslation(lang, 'settings.cafeRejected'),
    cafeRejectedDesc: getTranslation(lang, 'settings.cafeRejectedDesc'),
    photoApproved: getTranslation(lang, 'settings.photoApproved'),
    photoApprovedDesc: getTranslation(lang, 'settings.photoApprovedDesc'),
    photoRejected: getTranslation(lang, 'settings.photoRejected'),
    photoRejectedDesc: getTranslation(lang, 'settings.photoRejectedDesc'),
    updateSuccess: getTranslation(lang, 'settings.notificationUpdateSuccess'),
    updateError: getTranslation(lang, 'settings.notificationUpdateError'),
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <SettingsTabs activeTab={activeTab} translations={tabTranslations} />

      {activeTab === 'profile' && (
        <>
          <ProfileForm
            profile={profile}
            avatarUrl={avatarUrl}
            translations={profileFormTranslations}
          />
          <PrivacyToggle
            isPrivate={profile.is_private ?? false}
            translations={privacyTranslations}
          />
        </>
      )}

      {activeTab === 'security' && (
        <>
          <SecuritySection
            hasPasswordAuth={hasPassword}
            userEmail={userEmail || user.email || ''}
            translations={securityTranslations}
          />
          <DeleteAccountDialog
            userEmail={user.email || ''}
            scheduledDeletionAt={profile.scheduled_deletion_at}
            translations={deletionTranslations}
          />
        </>
      )}

      {activeTab === 'notifications' && (
        <NotificationsSection
          initialPreferences={notificationPreferences}
          translations={notificationTranslations}
        />
      )}
    </div>
  );
}
