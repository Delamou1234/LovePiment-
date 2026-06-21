import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: 'KabiShop — Parfums & Huiles à Conakry, Guinée',
    template: '%s | KabiShop',
  },
  description:
    'Parfums orientaux et huiles de qualité chez KabiShop à Conakry. Livraison rapide, paiement Mobile Money et carte bancaire.',
  keywords: ['parfums', 'huiles', 'Conakry', 'Guinée', 'KabiShop', 'boutique en ligne'],
  authors: [{ name: 'KabiShop' }],
  creator: 'KabiShop',
  openGraph: {
    type: 'website',
    locale: 'fr_GN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'KabiShop',
    title: 'KabiShop — Parfums & Huiles à Conakry, Guinée',
    description:
      'Parfums et huiles de qualité chez KabiShop à Conakry.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KabiShop — Parfums & Huiles à Conakry, Guinée',
    description: 'Parfums orientaux et huiles sélectionnées à Conakry.',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={cn('font-sans', inter.variable)} data-scroll-behavior="smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
