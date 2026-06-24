import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Love Piment&',
    short_name: 'Love Piment&',
    description: 'Boutique intime pour adultes à Conakry — livraison discrète',
    start_url: '/',
    display: 'standalone',
    background_color: '#0C0609',
    theme_color: '#9B1B2E',
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
