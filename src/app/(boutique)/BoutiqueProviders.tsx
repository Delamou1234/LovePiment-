'use client';

import { WishlistProvider } from '@/modules/compte/hooks/useWishlist';
import { FeatureFlagsProvider } from '@/shared/hooks/useFeatureFlags';
import { LivraisonConfigProvider } from '@/shared/hooks/useLivraisonConfig';
import { PanierDrawerHost } from '@/shared/ui/PanierDrawerHost';

/** Contexte client partagé (favoris, feature flags, panier) pour boutique et compte. */
export function BoutiqueProviders({ children }: { children: React.ReactNode }) {
  return (
    <FeatureFlagsProvider>
      <LivraisonConfigProvider>
        <WishlistProvider>
          {children}
          <PanierDrawerHost />
        </WishlistProvider>
      </LivraisonConfigProvider>
    </FeatureFlagsProvider>
  );
}
