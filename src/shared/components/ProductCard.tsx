'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Star, Zap } from 'lucide-react';
import { useState } from 'react';
import { creerItemPanier, selectQuantityForVariant, usePanier } from '@/store/panier';
import { trackEvent } from '@/shared/hooks/useTracking';
import { CartToast } from '@/shared/components/CartToast';
import { useWishlist } from '@/modules/compte/hooks/useWishlist';
import type { ProductCardVariant } from '@/shared/lib/product-card';

export type { ProductCardVariant };

interface ProductCardProps {
  id: string;
  slug: string;
  nom: string;
  categorie: string;
  prix: number;
  prixPromo?: number | null;
  promoFin?: string | null;
  image: string;
  featured?: boolean;
  rating?: number;
  reviews?: number;
  variante?: ProductCardVariant | null;
  priority?: boolean;
}

export function ProductCard({
  id,
  slug,
  nom,
  categorie,
  prix,
  prixPromo,
  promoFin,
  image,
  rating,
  reviews,
  variante,
  priority = false,
}: ProductCardProps) {
  const router = useRouter();
  const panier = usePanier();
  const { wishlisted, toggleProduct } = useWishlist(id);
  const variantId = variante?.variantId ?? '';
  const qtyInCart = usePanier(selectQuantityForVariant(variantId));
  const [toast, setToast] = useState<'add' | 'buy' | null>(null);
  const [busy, setBusy] = useState(false);

  const enPromo = prixPromo != null && prixPromo < prix;
  const prixAffiche = enPromo ? prixPromo : prix;
  const remisePct = enPromo ? Math.round((1 - prixPromo / prix) * 100) : 0;
  const formattedPrice = prixAffiche.toLocaleString('fr-FR') + ' GN';
  const formattedOriginal = prix.toLocaleString('fr-FR') + ' GN';
  const promoFinLabel = promoFin
    ? new Date(promoFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null;
  const canQuickAdd = Boolean(variante && variante.stock > 0);
  const afficherNotes = reviews != null && reviews > 0 && rating != null;

  const buildItem = (quantite = 1) =>
    creerItemPanier({
      variantId: variante!.variantId,
      productId: variante!.productId,
      nomProduit: nom,
      slug,
      image,
      prixProduit: prix,
      prixVariante: variante!.prix,
      taille: variante!.taille,
      couleur: variante!.couleur,
      quantite,
    });

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canQuickAdd || busy) return;

    setBusy(true);
    panier.ajouterItem(buildItem(1));
    void trackEvent('ADD_TO_CART', { productId: id, path: `/produits/${slug}` });
    setToast('add');
    setBusy(false);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canQuickAdd || busy) return;

    setBusy(true);
    panier.ajouterOuRemplacer(buildItem(1));
    void trackEvent('CHECKOUT_START', { productId: id, path: `/produits/${slug}` });
    setToast('buy');
    router.push('/commande');
    setBusy(false);
  };

  return (
    <>
      <article className="group flex flex-col bg-transparent">
        <div className="relative aspect-[3/4] w-full rounded-lg mb-3">
          <div className="absolute inset-0 overflow-hidden rounded-lg bg-[#f5f0e8]">
            <Link href={`/produits/${slug}`} className="absolute inset-0">
              <Image
                src={image}
                alt={nom}
                fill
                priority={priority}
                loading={priority ? undefined : 'lazy'}
                className="object-cover object-center group-hover:scale-[1.02] transition duration-500"
                sizes="(max-width: 640px) 50vw, 20vw"
              />
            </Link>
          </div>

          {enPromo && (
            <span className="absolute top-2.5 left-2.5 z-10 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              -{remisePct}%
            </span>
          )}

          {canQuickAdd && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex gap-1.5 overflow-visible opacity-100 sm:opacity-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition duration-300">
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={busy}
                className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/95 py-2 text-[11px] font-semibold text-zinc-900 shadow-sm hover:bg-white overflow-visible"
                aria-label={`Ajout rapide — ${nom}${qtyInCart > 0 ? ` (${qtyInCart} dans le panier)` : ''}`}
              >
                <span className="relative shrink-0">
                  <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2} />
                  {qtyInCart > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                      {qtyInCart > 99 ? '99+' : qtyInCart}
                    </span>
                  )}
                </span>
                Panier
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-1 rounded-full bg-zinc-900 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-zinc-800"
                aria-label={`Achat en un clic — ${nom}`}
              >
                <Zap className="h-3.5 w-3.5" />
                Acheter
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              await toggleProduct();
            }}
            className="absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105"
            aria-label="Favoris"
          >
            <Heart
              className={`h-3.5 w-3.5 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`}
            />
          </button>
        </div>

        <Link href={`/produits/${slug}`} className="space-y-0.5 px-0.5">
          <h3 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-1 group-hover:underline underline-offset-2">
            {nom}
          </h3>
          <p className="text-[11px] text-zinc-400">{categorie}</p>
          <div className="pt-0.5">
            {enPromo ? (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="text-sm font-bold text-red-600">{formattedPrice}</p>
                <p className="text-xs text-zinc-400 line-through">{formattedOriginal}</p>
              </div>
            ) : (
              <p className="text-sm font-bold text-zinc-900">{formattedPrice}</p>
            )}
            {promoFinLabel && (
              <p className="text-[10px] text-zinc-400 mt-0.5">Jusqu&apos;au {promoFinLabel}</p>
            )}
          </div>
          {afficherNotes && (
            <div className="flex items-center gap-0.5 pt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.round(rating!) ? 'fill-amber-400 text-amber-400' : 'fill-zinc-200 text-zinc-200'
                  }`}
                />
              ))}
              <span className="text-[10px] text-zinc-400 ml-1">({reviews})</span>
            </div>
          )}
        </Link>
      </article>

      <CartToast
        visible={toast === 'add'}
        message="Ajouté au panier"
        onHide={() => setToast(null)}
      />
    </>
  );
}
