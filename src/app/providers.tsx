'use client';

import { AuthProvider } from '@/hooks/use-auth';
import { I18nProvider } from '@/i18n/client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <I18nProvider>{children}</I18nProvider>
    </AuthProvider>
  );
}
