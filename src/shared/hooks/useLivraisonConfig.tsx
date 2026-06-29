'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { fetchApi } from '@/shared/lib/client-fetch';
import {
  LIVRAISON_CONFIG_DEFAULT,
  setRuntimeLivraisonConfig,
  type LivraisonConfig,
} from '@/shared/lib/shipping';

const LivraisonConfigContext = createContext<LivraisonConfig>(LIVRAISON_CONFIG_DEFAULT);

export function LivraisonConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<LivraisonConfig>(LIVRAISON_CONFIG_DEFAULT);

  useEffect(() => {
    let cancelled = false;

    fetchApi('/api/settings/livraison')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.livraison) return;
        const next: LivraisonConfig = {
          villeParDefaut: String(
            data.livraison.villeParDefaut ?? LIVRAISON_CONFIG_DEFAULT.villeParDefaut,
          ),
          tarifConakry: Number(data.livraison.tarifConakry ?? LIVRAISON_CONFIG_DEFAULT.tarifConakry),
          tarifHorsConakry: Number(
            data.livraison.tarifHorsConakry ?? LIVRAISON_CONFIG_DEFAULT.tarifHorsConakry,
          ),
          seuilGratuit: Number(data.livraison.seuilGratuit ?? LIVRAISON_CONFIG_DEFAULT.seuilGratuit),
          gratuiteActive: Boolean(
            data.livraison.gratuiteActive ?? LIVRAISON_CONFIG_DEFAULT.gratuiteActive,
          ),
          delaiLabel: data.livraison.delaiLabel ?? LIVRAISON_CONFIG_DEFAULT.delaiLabel,
          tarifsCommunes: data.livraison.tarifsCommunes ?? null,
        };
        setConfig(next);
        setRuntimeLivraisonConfig(next);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <LivraisonConfigContext.Provider value={config}>{children}</LivraisonConfigContext.Provider>
  );
}

export function useLivraisonConfig() {
  return useContext(LivraisonConfigContext);
}
