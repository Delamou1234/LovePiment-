import type { Metadata, Viewport } from 'next';
import './globals.css';
import { GoogleAnalytics } from '@/shared/components/GoogleAnalytics';
import { GlobalPageTracker } from '@/shared/components/GlobalPageTracker';
import { AppProviders } from '@/shared/providers/AppProviders';
import { PwaClientShell } from '@/shared/components/pwa/PwaClientShell';
import { fontClassNames, inter } from '@/shared/lib/fonts';

export const metadata: Metadata = {
  title: {
    default: 'Love Piment& — Boutique intime & plaisir à Conakry',
    template: '%s | Love Piment&',
  },
  description:
    'Boutique intime pour adultes à Conakry : sextoys, lingerie, lubrifiants. Livraison discrète, paiement Orange Money.',
  keywords: ['boutique intime', 'sextoys', 'lingerie', 'lubrifiant', 'Conakry', 'Guinée', 'Love Piment&'],
  authors: [{ name: 'Love Piment&' }],
  creator: 'Love Piment&',
  openGraph: {
    type: 'website',
    locale: 'fr_GN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Love Piment&',
    title: 'Love Piment& — Boutique intime & plaisir à Conakry',
    description:
      'Sextoys, lingerie et accessoires intimes Love Piment& — livraison discrète à Conakry.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Love Piment& — Boutique intime & plaisir à Conakry',
    description: 'Boutique érotique discrète à Conakry — sextoys, lingerie, lubrifiants.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Love Piment&',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#9B1B2E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${fontClassNames} ${inter.className}`} data-scroll-behavior="smooth">
      <body className="antialiased">
        <AppProviders>
          <GoogleAnalytics />
          <GlobalPageTracker />
          <PwaClientShell />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
