'use client';

import { usePageTracking } from '@/shared/hooks/useTracking';

/** Suivi des pages sur tout le site (boutique, compte, connexion…). */
export function GlobalPageTracker() {
  usePageTracking();
  return null;
}
