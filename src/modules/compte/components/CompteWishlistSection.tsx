'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Loader2, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/modules/compte/hooks/useWishlist';
import type { WishlistItemClient } from '@/modules/compte/types';
import { creerItemPanier, usePanier } from '@/store/panier';

export function CompteWishlistSection() {
  const [items, setItems] = useState<WishlistItemClient[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
    <section className="rounded-2xl border border-[#ebe4d8] bg-white p-6 md:p-8 shadow-sm">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-zinc-900">
        <Heart className="h-5 w-5 fill-red-500 text-red-500" />
        Ma liste de souhaits
      </h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-zinc-500 mb-4">Votre wishlist est vide.</p>
          <Link href="/produits">
            <Button className="bg-[#4a5240] hover:bg-[#3d4534] text-white rounded-full">
              Explorer le catalogue
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 rounded-xl border border-zinc-100 p-3 hover:border-zinc-200"
            >
              <Link href={`/produits/${item.product.slug}`} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                {item.product.image && (
                  <Image src={item.product.image} alt="" fill sizes="80px" className="object-cover" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/produits/${item.product.slug}`}
                  className="font-semibold text-sm text-zinc-900 line-clamp-2 hover:underline"
                >
                  {item.product.nom}
                </Link>
                <p className="text-xs text-zinc-400 mt-0.5">{item.product.categorie}</p>
                <p className="text-sm font-bold text-zinc-900 mt-1">
                  {(item.product.prixPromo ?? item.product.prix).toLocaleString('fr-FR')} GN
                </p>
                <div className="mt-2 flex gap-1">
                  {item.product.enStock && item.product.variante && (
                    <Button size="sm" variant="outline" onClick={() => ajouterPanier(item)}>
                      <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                      Panier
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => retirer(item.productId)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
