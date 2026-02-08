import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/profiles';
import { ContactForm } from '@/components/contact/contact-form';
import { Header } from '@/components/header';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';

export const metadata: Metadata = {
  title: 'Contact Us | Cafes Seoul',
  description: 'Send us a message',
};

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

export default async function ContactPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lang = await getLanguageFromCookies();

  // Pre-fill name/email for logged-in users
  let defaultName = '';
  let defaultEmail = '';

  if (user) {
    const profile = await getProfile(supabase, user.id);
    defaultName = profile?.display_name || user.user_metadata?.name || '';
    defaultEmail = user.email || '';
  }

  // Build translations
  const translationKeys = [
    'contact.title',
    'contact.description',
    'contact.name',
    'contact.namePlaceholder',
    'contact.email',
    'contact.emailPlaceholder',
    'contact.subject',
    'contact.subjectPlaceholder',
    'contact.message',
    'contact.messagePlaceholder',
    'contact.send',
    'contact.sending',
    'contact.success',
    'contact.error',
    'contact.error.nameMin',
    'contact.error.nameMax',
    'contact.error.emailRequired',
    'contact.error.emailInvalid',
    'contact.error.subjectMin',
    'contact.error.subjectMax',
    'contact.error.messageMin',
    'contact.error.messageMax',
  ];

  const translations: Record<string, string> = {};
  for (const key of translationKeys) {
    translations[key] = getTranslation(lang, key);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <ContactForm
          translations={translations}
          defaultName={defaultName}
          defaultEmail={defaultEmail}
          isLoggedIn={!!user}
        />
      </main>
    </div>
  );
}
