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
      : 'Promotions mises à jour régulièrement';

  return (
    <section className="w-full bg-zinc-950">
      <div className="container-kabishop">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 py-5 sm:py-6 md:gap-8">
          <div className="flex items-center gap-4 text-white min-w-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-olive shadow-lg shadow-olive/30">
              {flash ? <Zap className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm md:text-base font-bold leading-snug">{titre}</p>
              <p className="text-xs md:text-sm text-white/55 mt-1">{sousTitre}</p>
            </div>
          </div>
          <Link
            href="/promos"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-zinc-900 hover:bg-cream transition shrink-0 w-full sm:w-auto"
          >
            {flash ? 'Voir la vente flash' : 'Voir les promos'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
