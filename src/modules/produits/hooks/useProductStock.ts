'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSyncedState } from '@/shared/hooks/useSyncedState';
import type { StockVarianteClient } from '../types';

export function useProductStock(slug: string, initialVariantes: StockVarianteClient[]) {
  const [variantes, setVariantes] = useSyncedState(initialVariantes);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/produits/${slug}/stock`, { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { variantes: StockVarianteClient[]; updatedAt: string };
        setVariantes(data.variantes);
        setLastUpdated(data.updatedAt);
      }
    } catch {
      /* conserve les données précédentes */
    } finally {
      setLoading(false);
    }
  }, [slug, setVariantes]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  return { variantes, lastUpdated, loading, refresh };
}
