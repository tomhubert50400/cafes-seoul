'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME, SUPPORTED_LANGUAGES } from './languages';
import { translations } from './translations';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  languages: typeof SUPPORTED_LANGUAGES;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  // Check cookie first
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${LANGUAGE_COOKIE_NAME}=`));

  if (cookie) {
    const value = cookie.split('=')[1] as LanguageCode;
    if (value in SUPPORTED_LANGUAGES) return value;
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0] as LanguageCode;
  if (browserLang in SUPPORTED_LANGUAGES) return browserLang;

  return DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLanguageState(getInitialLanguage());
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    // Set cookie (expires in 1 year)
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    // Update html lang attribute
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key;
  }, [language]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <I18nContext.Provider value={{
        language: DEFAULT_LANGUAGE,
        setLanguage: () => {},
        t: (key) => translations[DEFAULT_LANGUAGE]?.[key] || key,
        languages: SUPPORTED_LANGUAGES
      }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
