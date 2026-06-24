'use client';

import { useCallback, useState } from 'react';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useSyncedState } from '@/shared/hooks/useSyncedState';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Loader2, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/modules/compte/hooks/useWishlist';
import type { WishlistItemClient } from '@/modules/compte/types';
import { creerItemPanier, usePanier } from '@/store/panier';
import {
  COMPTE_BTN_PRIMARY,
  COMPTE_CARD,
  COMPTE_CARD_PAD,
  COMPTE_SECTION_DESC,
  COMPTE_SECTION_TITLE,
} from './compte-ui';

type Props = {
  initialItems?: WishlistItemClient[];
};

export function CompteWishlistSection({ initialItems }: Props) {
  const [items, setItems] = useSyncedState(initialItems ?? []);
  const [loading, setLoading] = useState(initialItems == null);
  const { refresh } = useWishlist();
  const panier = usePanier();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/compte/wishlist');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [setItems]);

  useRunAfterMount(() => {
    if (initialItems != null) {
      setLoading(false);
      return;
    }
    void load();
  }, [initialItems, load]);

  const retirer = async (productId: string) => {
    await fetch(`/api/compte/wishlist/${productId}`, { method: 'DELETE' });
    await refresh();
    await load();
  };

  const ajouterPanier = (item: WishlistItemClient) => {
    const v = item.product.variante;
    if (!v || v.stock <= 0) return;
    panier.ajouterItem(
      creerItemPanier({
        variantId: v.id,
        productId: item.product.id,
        nomProduit: item.product.nom,
        slug: item.product.slug,
        image: item.product.image ?? '',
        prixProduit: item.product.prix,
        prixVariante: item.product.prixPromo ?? item.product.prix,
        quantite: 1,
      }),
    );
  };

  return (
    <div className={`${COMPTE_CARD} ${COMPTE_CARD_PAD}`}>
      <div className="mb-6 flex items-start gap-3 lg:hidden">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <Heart className="h-5 w-5 fill-current" />
        </div>
        <div>
          <h2 className={COMPTE_SECTION_TITLE}>Liste de souhaits</h2>
          <p className={COMPTE_SECTION_DESC}>Retrouvez vos produits favoris</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-olive" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cream">
            <Heart className="h-7 w-7 text-zinc-300" />
          </div>
          <p className="font-serif text-lg font-bold text-zinc-900">Aucun favori</p>
          <p className="mt-2 text-sm text-zinc-500 mb-6">
            Ajoutez des produits à votre liste depuis le catalogue.
          </p>
          <Link href="/produits">
            <span className={COMPTE_BTN_PRIMARY}>Explorer le catalogue</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const productUrl = `/produits/${item.product.slug}`;

            return (
              <article
                key={item.id}
                className="group flex gap-3 rounded-xl border border-beige-border bg-white p-4 transition hover:shadow-md hover:border-olive/20"
              >
                <Link
                  href={productUrl}
                  className="flex min-w-0 flex-1 gap-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
                  aria-label={`Voir ${item.product.nom}`}
                >
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-beige ring-1 ring-beige-border/50">
                    {item.product.image && (
                      <Image
                        src={item.product.image}
                        alt={item.product.nom}
                        fill
                        sizes="96px"
                        className="object-cover transition group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col">
                    <p className="font-semibold text-sm text-zinc-900 line-clamp-2 group-hover:text-olive transition-colors">
                      {item.product.nom}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-zinc-400 mt-1">
                      {item.product.categorie}
                    </p>
                    <p className="text-base font-bold text-zinc-900 mt-auto pt-2">
                      {(item.product.prixPromo ?? item.product.prix).toLocaleString('fr-FR')} GN
                    </p>
                  </div>
                </Link>

                <div className="flex shrink-0 flex-col justify-end gap-2 pb-0.5">
                  {item.product.enStock && item.product.variante && (
                    <Button
                      size="sm"
                      onClick={() => ajouterPanier(item)}
                      className="rounded-full bg-olive hover:bg-olive-dark text-white h-8 text-xs"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                      Panier
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => retirer(item.productId)}
                    className="rounded-full p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition self-end"
                    aria-label="Retirer des favoris"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
