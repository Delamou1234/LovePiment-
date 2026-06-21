import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'KabiShop — Parfums, huiles & crèmes corporelles à Conakry',
    template: '%s | KabiShop',
  },
  description:
    'Parfums, huiles pour la peau et crèmes corporelles à Conakry. Livraison rapide, paiement Mobile Money et carte bancaire.',
  keywords: ['parfums', 'huiles corporelles', 'crèmes corporelles', 'Conakry', 'Guinée', 'KabiShop'],
  authors: [{ name: 'KabiShop' }],
  creator: 'KabiShop',
  openGraph: {
    type: 'website',
    locale: 'fr_GN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'KabiShop',
    title: 'KabiShop — Parfums, huiles & crèmes corporelles à Conakry',
    description:
      'Parfums, huiles pour la peau et crèmes corporelles chez KabiShop à Conakry.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KabiShop — Parfums, huiles & crèmes corporelles à Conakry',
    description: 'Parfums, huiles peau et crèmes corporelles sélectionnées à Conakry.',
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
};

export const viewport: Viewport = {
  themeColor: '#4a5240',
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
    <html lang="fr" className="font-sans" data-scroll-behavior="smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
