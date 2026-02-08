import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getContactMessages } from '@/lib/supabase/contact-messages';
import { MessagesTable } from '@/components/admin/messages-table';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const lang = await getLanguageFromCookies();

  // Fetch all messages with user info
  const messages = await getContactMessages(supabase);

  // Build translations
  const translationKeys = [
    'admin.messages.title',
    'admin.messages.unread',
    'admin.messages.all',
    'admin.messages.empty',
    'admin.messages.sender',
    'admin.messages.subject',
    'admin.messages.date',
    'admin.messages.status',
    'admin.messages.view',
    'admin.messages.new',
    'admin.messages.read',
    'admin.messages.markRead',
    'admin.messages.markUnread',
    'admin.messages.markedRead',
    'admin.messages.markedUnread',
    'admin.messages.deleteTitle',
    'admin.messages.deleteConfirm',
    'admin.messages.deleted',
    'admin.messages.error',
    'admin.messages.from',
    'admin.messages.guest',
    'admin.messages.registeredUser',
    'admin.table.actions',
    'common.cancel',
    'common.delete',
    'common.close',
  ];

  const translations: Record<string, string> = {};
  for (const key of translationKeys) {
    translations[key] = getTranslation(lang, key);
  }

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{translations['admin.messages.title']}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {unreadCount} {translations['admin.messages.unread'].toLowerCase()}
        </p>
      </div>

      <MessagesTable messages={messages} translations={translations} />
    </div>
  );
}
