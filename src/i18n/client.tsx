
'use client';

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import resources from './resources';

export type Locale = 'en' | 'es';

const I18nContext = createContext<{
  t: (key: string, ...args: any[]) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
} | undefined>(undefined);

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // default language
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });

export function I18nProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const [locale, setLocaleState] = useState<Locale>(i18n.language as Locale);

  useEffect(() => {
    const storedLocale = localStorage.getItem('locale') as Locale | null;
    if (storedLocale && storedLocale !== i18n.language) {
      i18n.changeLanguage(storedLocale);
      setLocaleState(storedLocale);
    }
  }, [i18n]);

  const setLocale = (newLocale: Locale) => {
    i18n.changeLanguage(newLocale);
    localStorage.setItem('locale', newLocale);
    setLocaleState(newLocale);
  };

  const value = { t, locale, setLocale };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
