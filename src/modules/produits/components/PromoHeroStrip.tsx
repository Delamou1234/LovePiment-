import Link from 'next/link';
import Image from 'next/image';

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80';

type PromoStripItem = {
  slug: string;
  nom: string;
  image?: string | null;
  remisePct: number;
  prixPromoNum: number;
};

export function PromoHeroStrip({ produits }: { produits: PromoStripItem[] }) {
  if (produits.length === 0) return null;

  const featured = produits.slice(0, 4);

  return (
    <div className="border-b border-white/10 bg-primary">
      <div className="container-shop py-4 md:py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-3">
          Sélection en promotion
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide">
          {featured.map((p) => (
            <Link
              key={p.slug}
              href={`/produits/${p.slug}`}
              className="group flex shrink-0 snap-start items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 pr-4 hover:bg-white/10 transition min-w-[220px] max-w-[280px]"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/10">
                <Image
                  src={p.image || IMAGE_FALLBACK}
                  alt={p.nom}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="64px"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-red-600/90 text-center text-[9px] font-bold text-white py-0.5">
                  -{p.remisePct}%
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">{p.nom}</p>
                <p className="text-[11px] font-bold text-white/90 mt-1">
                  {p.prixPromoNum.toLocaleString('fr-FR')} GN
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
