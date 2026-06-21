'use client';

import { Copy, Gift, Users } from 'lucide-react';
import { LOYALTY } from '@/modules/marketing/lib/constants';

type Props = {
  pointsFidelite: number;
  codeParrainage: string;
};

export function CompteFideliteSection({ pointsFidelite, codeParrainage }: Props) {
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(codeParrainage);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="rounded-2xl border border-[#ebe4d8] bg-white p-6 md:p-8 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
        <Gift className="h-5 w-5 text-[#4a5240]" />
        Fidélité & parrainage
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#faf7f2] border border-[#ebe4d8] p-4">
          <p className="text-xs font-semibold uppercase text-zinc-500 tracking-wide">Mes points</p>
          <p className="text-2xl font-black text-[#4a5240] mt-1">{pointsFidelite}</p>
          <p className="text-xs text-zinc-500 mt-2">
            1 pt = {LOYALTY.VALEUR_POINT_GN.toLocaleString('fr-FR')} GN · max{' '}
            {Math.round(LOYALTY.MAX_REMISE_POINTS_PCT * 100)}% par commande
          </p>
        </div>

        <div className="rounded-xl bg-[#faf7f2] border border-[#ebe4d8] p-4">
          <p className="text-xs font-semibold uppercase text-zinc-500 tracking-wide flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Mon code parrain
          </p>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-lg font-bold text-zinc-900 tracking-wider">{codeParrainage}</code>
            <button
              type="button"
              onClick={copier}
              className="p-2 rounded-lg hover:bg-white text-zinc-500 hover:text-[#4a5240] transition"
              title="Copier"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            −{Math.round(LOYALTY.FILLEUL_REMISE_PCT * 100)}% pour vos filleuls (1ère commande) · +
            {LOYALTY.PARRAIN_POINTS} pts pour vous
          </p>
        </div>
      </div>
    </section>
  );
}
