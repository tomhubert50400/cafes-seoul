import { cookies } from 'next/headers';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { getApprovedCafes } from '@/lib/actions/admin';
import { AdminCafesManager } from '@/components/admin/admin-cafes-manager';

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

export default async function AdminCafesPage() {
  const lang = await getLanguageFromCookies();
  // Fetch initial cafes (limited for initial page load)
  const result = await getApprovedCafes({ limit: 50 });

  const translations = {
    'admin.cafes.title': getTranslation(lang, 'admin.cafes.title') || 'Manage Cafes',
    'admin.cafes.subtitle': getTranslation(lang, 'admin.cafes.subtitle') || 'View and delete approved cafes',
    'admin.cafes.empty': getTranslation(lang, 'admin.cafes.empty') || 'No cafes found',
    'admin.cafes.search': getTranslation(lang, 'admin.cafes.search') || 'Search by name or address...',
    'admin.cafes.noResults': getTranslation(lang, 'admin.cafes.noResults') || 'No cafes match your search',
    'admin.table.name': getTranslation(lang, 'admin.table.name'),
    'admin.table.address': getTranslation(lang, 'admin.table.address'),
    'admin.table.rating': getTranslation(lang, 'admin.table.rating') || 'Rating',
    'admin.table.reviews': getTranslation(lang, 'admin.table.reviews') || 'Reviews',
    'admin.table.date': getTranslation(lang, 'admin.table.date'),
    'admin.table.actions': getTranslation(lang, 'admin.table.actions'),
    'admin.delete.button': getTranslation(lang, 'admin.delete.button') || 'Delete',
    'admin.delete.title': getTranslation(lang, 'admin.delete.title') || 'Delete Cafe',
    'admin.delete.confirm': getTranslation(lang, 'admin.delete.confirm') || 'Are you sure you want to delete this cafe? This action cannot be undone. All associated photos, reviews, and favorites will also be deleted.',
    'admin.delete.success': getTranslation(lang, 'admin.delete.success') || 'Cafe deleted successfully',
    'admin.delete.error': getTranslation(lang, 'admin.delete.error') || 'Failed to delete cafe',
    'common.cancel': getTranslation(lang, 'common.cancel') || 'Cancel',
    'common.delete': getTranslation(lang, 'common.delete') || 'Delete',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{translations['admin.cafes.title']}</h1>
        <p className="mt-1 text-muted-foreground">
          {translations['admin.cafes.subtitle']}
        </p>
      </div>

      <AdminCafesManager
        initialCafes={result.cafes || []}
        totalCount={result.total || 0}
        translations={translations}
      />
    </div>
  );
}
