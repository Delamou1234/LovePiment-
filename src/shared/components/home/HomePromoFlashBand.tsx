import Link from 'next/link';
import { ArrowRight, Clock, Zap } from 'lucide-react';

type PromoStats = {
  total: number;
  remiseMax: number;
};

type FlashInfo = {
  titre: string;
  slug: string;
  fin: string;
  productCount: number;
} | null;

export function HomePromoFlashBand({
  stats,
  flash,
}: {
  stats: PromoStats;
  flash?: FlashInfo;
}) {
  const finFlash = flash ? new Date(flash.fin) : null;

  const titre = flash
    ? flash.titre
    : stats.remiseMax > 0
      ? `Vente flash — jusqu'à -${stats.remiseMax}%`
      : stats.total > 0
        ? `${stats.total} promotion${stats.total > 1 ? 's' : ''} en cours`
        : 'Découvrez nos offres';

  const sousTitre = flash
    ? `${flash.productCount} produit${flash.productCount > 1 ? 's' : ''} · fin ${finFlash?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
    : stats.total > 0
      ? `${stats.total} produit${stats.total > 1 ? 's' : ''} à prix réduit`
      : 'Configurez vos promos dans l’administration';

  const href = flash ? '/promos' : '/promos';

  return (
    <section className="container-kabishop mt-10 md:mt-14">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-zinc-900 px-6 py-4 md:px-8 md:py-5">
        <div className="flex items-center gap-3 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4a5240]">
            {flash ? <Zap className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          </span>
          <div>
            <p className="text-sm font-bold">{titre}</p>
            <p className="text-xs text-white/60">{sousTitre}</p>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-zinc-900 hover:bg-[#faf7f2] transition shrink-0"
        >
          {flash ? 'Voir la vente flash' : 'Voir les promos'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
