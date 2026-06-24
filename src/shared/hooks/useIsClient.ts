'use client';

import { useSyncExternalStore } from 'react';

/** Évite les mismatches d'hydratation sans setState dans un effet. */
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
