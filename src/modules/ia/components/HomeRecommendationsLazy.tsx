'use client';

import dynamic from 'next/dynamic';

export const HomeRecommendationsLazy = dynamic(
  () =>
    import('./HomeRecommendations').then((m) => ({
      default: m.HomeRecommendations,
    })),
  { ssr: false, loading: () => null },
);
