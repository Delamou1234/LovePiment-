import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Love Piment& — Boutique',
    short_name: 'Love Piment&',
    description:
      'Boutique Love Piment& à Conakry : catalogue, commande, suivi et compte client. Installez l’app sur votre téléphone.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    orientation: 'portrait',
    background_color: '#0C0609',
    theme_color: '#9B1B2E',
    lang: 'fr',
    dir: 'ltr',
    categories: ['shopping', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Catalogue',
        short_name: 'Produits',
        url: '/produits?source=pwa-shortcut',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Mon panier',
        short_name: 'Panier',
        url: '/panier?source=pwa-shortcut',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Mon compte',
        short_name: 'Compte',
        url: '/compte?source=pwa-shortcut',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
