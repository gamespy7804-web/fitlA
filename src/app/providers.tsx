'use client';

import { AuthProvider } from '@/hooks/use-auth';
import { UserDataProvider } from '@/hooks/use-user-data';
import { I18nProvider } from '@/i18n/client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <UserDataProvider>{children}</UserDataProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
