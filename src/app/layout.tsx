import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/i18n/client';
import { AuthProvider } from '@/hooks/use-auth';

export const metadata: Metadata = {
  title: 'TrainSmart AI',
  description: 'Your personal AI sports trainer.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
            <I18nProvider>
                {children}
            </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
