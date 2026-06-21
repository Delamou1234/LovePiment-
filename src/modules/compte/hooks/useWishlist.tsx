'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchApi } from '@/shared/lib/client-fetch';

type WishlistContextValue = {
  productIds: Set<string>;
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetchApi('/api/compte/wishlist/ids', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { productIds: string[] };
        setProductIds(new Set(data.productIds));
      } else {
        setProductIds(new Set());
      }
    } catch {
      setProductIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(async (productId: string) => {
    const wasWishlisted = productIds.has(productId);

    if (wasWishlisted) {
      setProductIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      const res = await fetch(`/api/compte/wishlist/${productId}`, { method: 'DELETE' });
      if (res.status === 401) {
        window.location.href = `/connexion?redirect=${encodeURIComponent(window.location.pathname)}`;
        return false;
      }
      if (!res.ok) {
        await refresh();
        return productIds.has(productId);
      }
      return false;
    }

    setProductIds((prev) => new Set(prev).add(productId));
    const res = await fetch('/api/compte/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    if (res.status === 401) {
      setProductIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      window.location.href = `/connexion?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }
    if (!res.ok) {
      await refresh();
      return false;
    }
    return true;
  }, [productIds, refresh]);

  const value = useMemo(
    () => ({
      productIds,
      loading,
      isWishlisted: (id: string) => productIds.has(id),
      toggle,
      refresh,
    }),
    [productIds, loading, toggle, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(productId?: string) {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }

  return {
    ...ctx,
    wishlisted: productId ? ctx.isWishlisted(productId) : false,
    toggleProduct: productId ? () => ctx.toggle(productId) : ctx.toggle,
  };
}
