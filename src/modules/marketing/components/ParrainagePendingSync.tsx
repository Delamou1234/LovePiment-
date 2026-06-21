'use client';

import { useEffect } from 'react';
import { PARRAINAGE_SESSION_KEY } from '@/modules/marketing/lib/referral-code';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';

/** Applique un code parrain stocké lors de l'inscription (ex. connexion sociale). */
export function ParrainagePendingSync() {
  const { parrainageActif } = useFeatureFlags();

  useEffect(() => {
    if (!parrainageActif) return;
    const pending = sessionStorage.getItem(PARRAINAGE_SESSION_KEY);
    if (!pending) return;

    fetch('/api/compte/parrainage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: pending }),
    }).finally(() => {
      sessionStorage.removeItem(PARRAINAGE_SESSION_KEY);
    });
  }, [parrainageActif]);

  return null;
}
