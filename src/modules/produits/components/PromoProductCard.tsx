'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, ShoppingBag, Zap } from 'lucide-react';
import { creerItemPanier, selectQuantityForVariant, usePanier } from '@/store/panier';
import { trackEvent } from '@/shared/hooks/useTracking';
import { CartToast } from '@/shared/components/CartToast';
import type { ProductCardVariant } from '@/shared/lib/product-card';
import { formaterDatePromo } from '@/modules/produits/lib/promo';

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80';

export interface PromoProductCardProps {
  id: string;
  slug: string;
  nom: string;
  categorie: string;
  prix: number;
  prixPromo: number;
  promoFin?: string | null;
  image?: string | null;
  remisePct: number;
  variante?: ProductCardVariant | null;
}

export function PromoProductCard({
  id,
  slug,
  nom,
  categorie,
  prix,
  prixPromo,
  promoFin,
  image,
  remisePct,
  variante,
}: PromoProductCardProps) {
  const router = useRouter();
  const panier = usePanier();
  const variantId = variante?.variantId ?? '';
  const qtyInCart = usePanier(selectQuantityForVariant(variantId));
  const [toast, setToast] = useState(false);
  const [busy, setBusy] = useState(false);

  const imgSrc = image || IMAGE_FALLBACK;
  const economie = prix - prixPromo;
  const canAdd = Boolean(variante && variante.stock > 0);
  const finLabel = promoFin ? formaterDatePromo(promoFin) : null;

  const buildItem = () =>
    creerItemPanier({
      variantId: variante!.variantId,
      productId: variante!.productId,
      nomProduit: nom,
      slug,
      image: imgSrc,
      prixProduit: prix,
      prixVariante: variante!.prix,
      taille: variante!.taille,
      couleur: variante!.couleur,
      quantite: 1,
    });

  const handleAdd = () => {
    if (!canAdd || busy) return;
    setBusy(true);
    panier.ajouterItem(buildItem());
    void trackEvent('ADD_TO_CART', { productId: id, path: `/produits/${slug}` });
    setToast(true);
    setBusy(false);
  };

  const handleBuy = () => {
    if (!canAdd || busy) return;
    setBusy(true);
    panier.ajouterOuRemplacer(buildItem());
    void trackEvent('CHECKOUT_START', { productId: id, path: `/produits/${slug}` });
    router.push('/commande');
    setBusy(false);
  };

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#ebe4d8] bg-white shadow-sm transition hover:shadow-md hover:border-[#4a5240]/30">
        <div className="relative aspect-[4/5] bg-[#f5f0e8]">
          <Link href={`/produits/${slug}`} className="absolute inset-0">
            <Image
              src={imgSrc}
              alt={nom}
              fill
              className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          </Link>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

          <span className="absolute top-3 left-3 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">
            -{remisePct}%
          </span>

          <span className="absolute top-3 right-3 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-[#4a5240] shadow-sm">
            {categorie}
          </span>

          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
            <div className="min-w-0">
              <p className="font-serif text-base font-bold text-white line-clamp-2 drop-shadow-sm">
                {nom}
              </p>
              {finLabel && (
                <p className="text-[10px] text-white/80 mt-0.5">Jusqu&apos;au {finLabel}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 p-4 gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-red-600">
                {prixPromo.toLocaleString('fr-FR')} GN
              </p>
              <p className="text-xs text-zinc-400 line-through">
                {prix.toLocaleString('fr-FR')} GN
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400">Économie</p>
              <p className="text-sm font-bold text-[#4a5240]">
                {economie.toLocaleString('fr-FR')} GN
              </p>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-3 gap-2">
            <Link
              href={`/produits/${slug}`}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#ebe4d8] py-2.5 text-[11px] font-semibold text-zinc-700 hover:bg-[#faf7f2] transition"
            >
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              Voir
            </Link>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd || busy}
              className="relative inline-flex items-center justify-center gap-1 rounded-xl border border-[#4a5240] py-2.5 text-[11px] font-semibold text-[#4a5240] hover:bg-[#4a5240]/5 disabled:opacity-40 transition"
            >
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
              Panier
              {qtyInCart > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-0.5 text-[9px] font-bold text-white">
                  {qtyInCart > 99 ? '99+' : qtyInCart}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleBuy}
              disabled={!canAdd || busy}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#4a5240] py-2.5 text-[11px] font-semibold text-white hover:bg-[#3d4534] disabled:opacity-40 transition"
            >
              <Zap className="h-3.5 w-3.5 shrink-0" />
              Acheter
            </button>
          </div>

          {!canAdd && (
            <p className="text-[10px] text-amber-700 text-center">Rupture de stock temporaire</p>
          )}
        </div>
      </article>

      <CartToast visible={toast} message="Ajouté au panier" onHide={() => setToast(false)} />
    </>
  );
}
