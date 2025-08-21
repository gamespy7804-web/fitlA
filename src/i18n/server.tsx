
import { createInstance } from 'i18next';
import { cookies } from 'next/headers';
import { I18nextProvider } from 'react-i18next';
import { initReactI18next } from 'react-i18next';
import resources from './resources';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = cookies().get('locale')?.value || 'es';

  const i18n = createInstance();
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: locale,
      fallbackLng: 'es',
      interpolation: {
        escapeValue: false,
      },
    });

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export async function i18n(lng: 'en' | 'es') {
  const i18next = createInstance()
  await i18next
    .use(initReactI18next)
    .init({
      resources,
      lng,
    })
  return {
    t: i18next.getFixedT(lng),
    i18n: i18next
  }
}
