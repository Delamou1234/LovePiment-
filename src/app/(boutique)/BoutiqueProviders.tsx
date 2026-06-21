'use client';

import { WishlistProvider } from '@/modules/compte/hooks/useWishlist';

/** Contexte client partagé (favoris) pour toute la boutique. */
export function BoutiqueProviders({ children }: { children: React.ReactNode }) {
  return <WishlistProvider>{children}</WishlistProvider>;
}
