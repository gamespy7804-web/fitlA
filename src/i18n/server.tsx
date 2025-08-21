import i18next from 'i18next';
import resources from './resources';
import type { Locale } from './client';

// This function is for use in Server Components and server-side logic (e.g., Genkit flows)
export async function i18n(lng: Locale) {
  const instance = i18next.createInstance();
  await instance.init({
    resources,
    lng,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
    // Important for server-side usage
    react: {
        useSuspense: false,
    }
  });
  return instance.t;
}
