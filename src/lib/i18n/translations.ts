import { LanguageCode } from './languages';
import en from './locales/en';
import ko from './locales/ko';
import fr from './locales/fr';
import zh from './locales/zh';
import vi from './locales/vi';

/**
 * Get a translation string for a given language and key
 * Falls back to English if the translation is not found
 */
export function getTranslation(lang: LanguageCode, key: string): string {
  return translations[lang]?.[key] || translations['en']?.[key] || key;
}

/**
 * All translations combined. Used by server components via getTranslation().
 * Client components should use useI18n() which loads languages dynamically.
 */
export const translations: Record<LanguageCode, Record<string, string>> = {
  en,
  ko,
  fr,
  zh,
  vi,
};

/**
 * Dynamically load translations for a specific language.
 * Used by the i18n context for client-side lazy loading.
 */
export async function loadTranslations(lang: LanguageCode): Promise<Record<string, string>> {
  switch (lang) {
    case 'en':
      return (await import('./locales/en')).default;
    case 'ko':
      return (await import('./locales/ko')).default;
    case 'fr':
      return (await import('./locales/fr')).default;
    case 'zh':
      return (await import('./locales/zh')).default;
    case 'vi':
      return (await import('./locales/vi')).default;
    default:
      return (await import('./locales/en')).default;
  }
}
