'use client';

import { useEffect, useRef, useState } from 'react';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Sparkles } from 'lucide-react';
import { getCartProductIds, getViewedProductIds } from '@/shared/hooks/useViewedProducts';
import {
  BEAUTY_PROFILE_UPDATED_EVENT,
  encoderProfilBeautePourApi,
  lireProfilBeauteLocal,
} from '@/modules/ia/lib/beauty-profile';
import type { ProduitRecommande } from '@/modules/ia/types';

export function HomeRecommendations() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [products, setProducts] = useState<ProduitRecommande[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener(BEAUTY_PROFILE_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(BEAUTY_PROFILE_UPDATED_EVENT, onUpdate);
  }, []);

  useRunAfterMount(() => {
    if (!visible) return;

    setLoading(true);
    const viewed = getViewedProductIds();
    const cart = getCartProductIds();
    const beautyProfile = lireProfilBeauteLocal();
    const params = new URLSearchParams();
    if (viewed.length) params.set('viewed', viewed.join(','));
    if (cart.length) params.set('cart', cart.join(','));
    const encodedProfile = encoderProfilBeautePourApi(beautyProfile);
    if (encodedProfile) params.set('profile', encodedProfile);
    params.set('limit', '8');

    fetch(`/api/ia/recommendations?${params}`)
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        setProducts(data.products ?? []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [visible, refreshKey]);

  if (!visible) {
    return <section ref={sectionRef} className="min-h-[1px]" aria-hidden />;
  }

  if (loading) {
    return (
      <section ref={sectionRef} className="py-12 md:py-16">
        <div className="container-shop flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#9B1B2E]" />
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-12 md:py-16 border-t border-[#F2D4DC]/60">
      <div className="container-shop">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#9B1B2E] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Pour vous
            </p>
            <h2 className="text-2xl font-black text-zinc-900 md:text-3xl">
              Recommandations personnalisées
            </h2>
            <p className="text-sm text-zinc-500 max-w-lg">
              Sélectionnées selon votre navigation, votre panier et votre profil intime.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/profil-beaute" className="text-sm font-semibold text-[#9B1B2E] hover:underline">
              Personnaliser mon profil →
            </Link>
            <Link href="/produits" className="text-sm font-semibold text-[#9B1B2E] hover:underline">
              Explorer la boutique →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/produits/${p.slug}`}
              className="group block rounded-xl border border-[#F2D4DC] bg-white overflow-hidden hover:shadow-md transition"
            >
              <div className="relative aspect-[3/4] bg-[#FCEEE8]">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.nom}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition duration-500"
                    sizes="(max-width:768px) 50vw, 25vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-300 text-xs">
                    Sans image
                  </div>
                )}
              </div>
              <div className="p-3 space-y-0.5">
                <p className="text-sm font-semibold text-zinc-900 line-clamp-1 group-hover:underline">
                  {p.nom}
                </p>
                <p className="text-[11px] text-zinc-400">{p.categorie}</p>
                <p className="text-sm font-bold text-zinc-900">
                  {p.prix.toLocaleString('fr-FR')} GN
                </p>
                {p.raison && (
                  <p className="text-[10px] text-[#9B1B2E] line-clamp-2 pt-1">{p.raison}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
