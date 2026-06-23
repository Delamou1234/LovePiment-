import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KabiShop',
    short_name: 'KabiShop',
    description: 'Parfums, huiles et crèmes corporelles à Conakry',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf7f2',
    theme_color: '#4a5240',
    lang: 'fr',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
