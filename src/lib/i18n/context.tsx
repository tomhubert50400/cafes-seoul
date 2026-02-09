'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME, SUPPORTED_LANGUAGES } from './languages';
import en from './locales/en';
import { loadTranslations } from './translations';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  languages: typeof SUPPORTED_LANGUAGES;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  initialLanguage?: LanguageCode;
}

export function I18nProvider({ children, initialLanguage }: I18nProviderProps) {
  // Use initialLanguage from server to prevent hydration mismatch
  const [language, setLanguageState] = useState<LanguageCode>(initialLanguage ?? DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);
  // English is always loaded statically as fallback; other languages load dynamically
  const [activeTranslations, setActiveTranslations] = useState<Record<string, string>>(en);

  // Load the active language's translations
  useEffect(() => {
    setMounted(true);
    document.documentElement.lang = language;

    if (language === 'en') {
      setActiveTranslations(en);
    } else {
      loadTranslations(language).then(setActiveTranslations);
    }
  }, [language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    // Set cookie (expires in 1 year)
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    // Update html lang attribute
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((key: string): string => {
    return activeTranslations[key] || en[key] || key;
  }, [activeTranslations]);

  // Use consistent value for both server and client render
  const contextValue = {
    language,
    setLanguage: mounted ? setLanguage : () => {},
    t,
    languages: SUPPORTED_LANGUAGES
  };

  return (
    <I18nContext.Provider value={contextValue}>
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
