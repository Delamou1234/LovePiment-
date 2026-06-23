'use client';

import { WishlistProvider } from '@/modules/compte/hooks/useWishlist';
import { FeatureFlagsProvider } from '@/shared/hooks/useFeatureFlags';
import { AuthSessionProvider } from '@/shared/providers/AuthSessionProvider';
import { PanierDrawerHost } from '@/shared/ui/PanierDrawerHost';

/** Contexte client partagé (favoris, feature flags, panier) pour boutique et compte. */
export function BoutiqueProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <FeatureFlagsProvider>
        <WishlistProvider>
          {children}
          <PanierDrawerHost />
        </WishlistProvider>
      </FeatureFlagsProvider>
    </AuthSessionProvider>
  );
}
