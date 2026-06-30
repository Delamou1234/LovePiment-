'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TotauxMarketing } from '@/modules/marketing/types';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';

type Props = {
  sousTotal: number;
  clientVille: string;
  clientCommune?: string;
  estPremiereCommande?: boolean;
  /** Contexte checkout chargé (évite les appels API prématurés). */
  contexteCharge?: boolean;
  /** Offre bienvenue activée par l'admin + 1ʳᵉ commande */
  bienvenueActif?: boolean;
  codeBienvenue?: string | null;
  onTotauxChange: (totaux: TotauxMarketing | null) => void;
  onMarketingChange: (data: {
    codeCoupon: string | null;
    pointsUtilises: number;
    codeParrainage: string | null;
  }) => void;
};

/**
 * Applique automatiquement les offres activées par l'admin (bienvenue, parrainage).
 * Aucune UI — les remises apparaissent uniquement dans le récapitulatif.
 */
export function CheckoutMarketingPanel({
  sousTotal,
  clientVille,
  clientCommune,
  estPremiereCommande,
  contexteCharge = true,
  bienvenueActif,
  codeBienvenue,
  onTotauxChange,
  onMarketingChange,
}: Props) {
  const { parrainageActif } = useFeatureFlags();
  const couponAuto = Boolean(bienvenueActif && codeBienvenue);
  const codeCouponAuto = couponAuto ? (codeBienvenue ?? null) : null;
  const [codeParrainage, setCodeParrainage] = useState('');

  useEffect(() => {
    if (!parrainageActif || !estPremiereCommande) return;
    fetch('/api/compte/parrainage')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const code = data?.statut?.codePourCheckout as string | null | undefined;
        if (code) setCodeParrainage(code);
      })
      .catch(() => {});
  }, [parrainageActif, estPremiereCommande]);

  const recalculer = useCallback(async () => {
    if (!contexteCharge || !clientVille.trim() || sousTotal <= 0) return;

    try {
      const res = await fetch('/api/marketing/totaux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sousTotal,
          clientVille,
          clientCommune: clientCommune || null,
          estPremiereCommande,
          codeCoupon: codeCouponAuto,
          pointsUtilises: 0,
          codeParrainage:
            parrainageActif && estPremiereCommande
              ? codeParrainage.trim().toUpperCase() || null
              : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onTotauxChange(data.totaux);
      onMarketingChange({
        codeCoupon: codeCouponAuto,
        pointsUtilises: 0,
        codeParrainage:
          parrainageActif && estPremiereCommande
            ? codeParrainage.trim().toUpperCase() || null
            : null,
      });
    } catch {
      onTotauxChange(null);
    }
  }, [
    sousTotal,
    clientVille,
    clientCommune,
    estPremiereCommande,
    codeCouponAuto,
    codeParrainage,
    parrainageActif,
    contexteCharge,
    onTotauxChange,
    onMarketingChange,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => void recalculer(), 400);
    return () => clearTimeout(timer);
  }, [recalculer]);

  return null;
}
