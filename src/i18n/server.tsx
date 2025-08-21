
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import resources from './resources';

// This function is for use in Server Components and server-side logic (e.g., Genkit flows)
export async function i18n(lng: 'en' | 'es') {
  const i18nextInstance = createInstance();
  await i18nextInstance
    .use(initReactI18next) // this is needed for i18next to work with React
    .init({
      resources,
      lng,
      fallbackLng: 'es',
      interpolation: {
        escapeValue: false, // react already safes from xss
      },
    });
  return {
    t: i18nextInstance.getFixedT(lng),
    i18n: i18nextInstance
  }
}
