'use client';

import { useCallback, useEffect, useState } from 'react';
import { Gift, Loader2, Sparkles, Tag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formaterPrixGN } from '@/shared/lib/shipping';
import { LOYALTY } from '@/modules/marketing/lib/constants';
import type { TotauxMarketing } from '@/modules/marketing/types';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';

type Props = {
  sousTotal: number;
  clientVille: string;
  pointsDisponibles: number;
  onTotauxChange: (totaux: TotauxMarketing | null) => void;
  onMarketingChange: (data: {
    codeCoupon: string | null;
    pointsUtilises: number;
    codeParrainage: string | null;
  }) => void;
};

export function CheckoutMarketingPanel({
  sousTotal,
  clientVille,
  pointsDisponibles,
  onTotauxChange,
  onMarketingChange,
}: Props) {
  const { parrainageActif } = useFeatureFlags();
  const [codeCoupon, setCodeCoupon] = useState('');
  const [codeParrainage, setCodeParrainage] = useState('');
  const [pointsUtilises, setPointsUtilises] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponOk, setCouponOk] = useState(false);
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [loadingTotaux, setLoadingTotaux] = useState(false);
  const [totaux, setTotaux] = useState<TotauxMarketing | null>(null);

  useEffect(() => {
    if (!parrainageActif) return;
    fetch('/api/compte/parrainage')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const code = data?.statut?.codePourCheckout as string | null | undefined;
        if (code) setCodeParrainage(code);
      })
      .catch(() => {});
  }, [parrainageActif]);

  const recalculer = useCallback(async () => {
    setLoadingTotaux(true);
    try {
      const res = await fetch('/api/marketing/totaux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sousTotal,
          clientVille,
          codeCoupon: couponOk ? codeCoupon : null,
          pointsUtilises,
          codeParrainage: parrainageActif ? codeParrainage.trim() || null : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTotaux(data.totaux);
      onTotauxChange(data.totaux);
      onMarketingChange({
        codeCoupon: couponOk ? codeCoupon.trim().toUpperCase() : null,
        pointsUtilises,
        codeParrainage: parrainageActif ? codeParrainage.trim().toUpperCase() || null : null,
      });
    } catch (err) {
      setTotaux(null);
      onTotauxChange(null);
    } finally {
      setLoadingTotaux(false);
    }
  }, [
    sousTotal,
    clientVille,
    codeCoupon,
    couponOk,
    pointsUtilises,
    codeParrainage,
    parrainageActif,
    onTotauxChange,
    onMarketingChange,
  ]);

  useEffect(() => {
    const timer = setTimeout(recalculer, 400);
    return () => clearTimeout(timer);
  }, [recalculer]);

  const appliquerCoupon = async () => {
    if (!codeCoupon.trim()) return;
    setLoadingCoupon(true);
    setCouponMsg('');
    try {
      const res = await fetch('/api/marketing/coupon/valider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeCoupon, sousTotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCouponOk(true);
      setCouponMsg(`Remise : ${formaterPrixGN(data.coupon.remiseEstimee)}`);
    } catch (err) {
      setCouponOk(false);
      setCouponMsg(err instanceof Error ? err.message : 'Code invalide');
    } finally {
      setLoadingCoupon(false);
    }
  };

  const maxPoints = Math.min(
    pointsDisponibles,
    Math.floor((sousTotal * LOYALTY.MAX_REMISE_POINTS_PCT) / LOYALTY.VALEUR_POINT_GN),
  );

  return (
    <div className="border border-zinc-100 rounded-2xl p-6 bg-white shadow-sm space-y-5">
      <h2 className="font-extrabold text-zinc-950 text-lg border-b border-zinc-100 pb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" /> Codes promo & fidélité
      </h2>

      <div className="space-y-2">
        <label className="text-xs font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
          <Tag className="h-3.5 w-3.5" /> Coupon de réduction
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={codeCoupon}
            onChange={(e) => {
              setCodeCoupon(e.target.value.toUpperCase());
              setCouponOk(false);
              setCouponMsg('');
            }}
            placeholder="Ex: BIENVENUE10"
            className="input-kabishop flex-1 uppercase"
          />
          <Button
            type="button"
            variant="outline"
            onClick={appliquerCoupon}
            disabled={loadingCoupon || !codeCoupon.trim()}
          >
            {loadingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Appliquer'}
          </Button>
        </div>
        {couponMsg && (
          <p className={`text-xs font-semibold ${couponOk ? 'text-emerald-600' : 'text-red-500'}`}>
            {couponMsg}
          </p>
        )}
      </div>

      {pointsDisponibles > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
            <Gift className="h-3.5 w-3.5" /> Points fidélité ({pointsDisponibles} pts)
          </label>
          <input
            type="range"
            min={0}
            max={maxPoints}
            value={pointsUtilises}
            onChange={(e) => setPointsUtilises(Number(e.target.value))}
            className="w-full accent-[#4a5240]"
          />
          <p className="text-xs text-zinc-500">
            Utiliser {pointsUtilises} pts (−{formaterPrixGN(pointsUtilises * LOYALTY.VALEUR_POINT_GN)})
          </p>
        </div>
      )}

      {parrainageActif && (
      <div className="space-y-2">
        <label className="text-xs font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> Code parrainage (1ère commande)
        </label>
        <input
          type="text"
          value={codeParrainage}
          onChange={(e) => setCodeParrainage(e.target.value.toUpperCase())}
          placeholder="Ex: KABI4X2YZ"
          className="input-kabishop uppercase"
        />
        {codeParrainage && (
          <p className="text-[11px] text-emerald-700 font-medium">
            Remise parrainage −{Math.round(LOYALTY.FILLEUL_REMISE_PCT * 100)}% sur votre première commande
          </p>
        )}
      </div>
      )}

      {loadingTotaux && (
        <p className="text-xs text-zinc-400 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Recalcul…
        </p>
      )}

      {totaux && (totaux.remiseCoupon > 0 || totaux.remisePoints > 0 || totaux.remiseParrainage > 0) && (
        <div className="rounded-xl bg-[#faf7f2] border border-[#ebe4d8] p-3 text-xs space-y-1">
          {totaux.remiseCoupon > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Coupon</span>
              <span>−{formaterPrixGN(totaux.remiseCoupon)}</span>
            </div>
          )}
          {totaux.remisePoints > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Points fidélité</span>
              <span>−{formaterPrixGN(totaux.remisePoints)}</span>
            </div>
          )}
          {totaux.remiseParrainage > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Parrainage</span>
              <span>−{formaterPrixGN(totaux.remiseParrainage)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
