'use client';

import dynamic from 'next/dynamic';

type Props = {
  productId: string;
  categorieId: string;
};

const ProductAiRecommendations = dynamic(
  () =>
    import('./ProductAiRecommendations').then((m) => ({
      default: m.ProductAiRecommendations,
    })),
  { ssr: false, loading: () => null },
);

export function ProductAiRecommendationsLazy(props: Props) {
  return <ProductAiRecommendations {...props} />;
}
