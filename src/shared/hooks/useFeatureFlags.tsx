'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { fetchApi } from '@/shared/lib/client-fetch';

export type FeatureFlags = {
  parrainageActif: boolean;
  appelsActifs: boolean;
};

const DEFAULT: FeatureFlags = {
  parrainageActif: true,
  appelsActifs: true,
};

const FeatureFlagsContext = createContext<FeatureFlags>(DEFAULT);

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<FeatureFlags>(DEFAULT);

  useEffect(() => {
    let cancelled = false;

    fetchApi('/api/settings/features')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.features) return;
        setFeatures({
          parrainageActif: Boolean(data.features.parrainageActif),
          appelsActifs: Boolean(data.features.appelsActifs),
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FeatureFlagsContext.Provider value={features}>{children}</FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
