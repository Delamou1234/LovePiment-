'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StockVarianteClient } from '../types';

const POLL_INTERVAL_MS = 20_000;

export function useProductStock(slug: string, initialVariantes: StockVarianteClient[]) {
  const [variantes, setVariantes] = useState(initialVariantes);
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
  }, [slug]);

  useEffect(() => {
    setVariantes(initialVariantes);
  }, [initialVariantes]);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return { variantes, lastUpdated, loading, refresh };
}
