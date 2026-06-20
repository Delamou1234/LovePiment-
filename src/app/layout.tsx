import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: 'KabiShop — Mode & Beauté à Conakry, Guinée',
    template: '%s | KabiShop',
  },
  description:
    'Découvrez la mode tendance chez KabiShop, votre boutique de vêtements à Conakry. Livraison rapide, paiement Mobile Money et carte bancaire.',
  keywords: ['vêtements', 'mode', 'Conakry', 'Guinée', 'KabiShop', 'boutique en ligne'],
  authors: [{ name: 'KabiShop' }],
  creator: 'KabiShop',
  openGraph: {
    type: 'website',
    locale: 'fr_GN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'KabiShop',
    title: 'KabiShop — Boutique de Vêtements à Conakry, Guinée',
    description:
      'Découvrez la mode tendance chez KabiShop, votre boutique de vêtements à Conakry.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KabiShop — Boutique de Vêtements à Conakry, Guinée',
    description: 'Découvrez la mode tendance chez KabiShop.',
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
    <html lang="fr" className={cn("font-sans", geist.variable)} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
