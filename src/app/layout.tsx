import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'workout IA',
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
        <meta name="google-adsense-account" content="ca-pub-9675156642757442" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        {/* 
          AdSense Code Added.
          This script connects the application to your AdSense account.
        */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9675156642757442"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-body antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
