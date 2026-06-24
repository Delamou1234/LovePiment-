'use client';

import { useEffect, useRef, useState } from 'react';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Sparkles } from 'lucide-react';
import type { ProduitRecommande } from '@/modules/ia/types';

type ProductAiRecommendationsProps = {
  productId: string;
  categorieId: string;
};

export function ProductAiRecommendations({
  productId,
  categorieId,
}: ProductAiRecommendationsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [products, setProducts] = useState<ProduitRecommande[]>([]);
  const [poweredByAi, setPoweredByAi] = useState(false);
  const [loading, setLoading] = useState(false);

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
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useRunAfterMount(() => {
    if (!visible) return;

    setLoading(true);
    const params = new URLSearchParams({
      mode: 'similaires',
      productId,
      categorieId,
      limit: '4',
    });

    fetch(`/api/ia/recommendations?${params}`)
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        setProducts(data.products ?? []);
        setPoweredByAi(Boolean(data.poweredByAi));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [visible, productId, categorieId]);

  if (!visible) {
    return <section ref={sectionRef} className="min-h-[1px]" aria-hidden />;
  }

  if (loading) {
    return (
      <section ref={sectionRef} className="py-8 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#9B1B2E]" />
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section ref={sectionRef} className="border-t border-[#F2D4DC]/60 pt-12">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-4 w-4 text-[#9B1B2E]" />
        <h2 className="text-lg font-bold text-zinc-900">
          {poweredByAi ? 'Recommandations IA' : 'Vous aimerez aussi'}
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/produits/${p.slug}`}
            className="group rounded-xl border border-[#F2D4DC] bg-white overflow-hidden hover:shadow-md transition"
          >
            <div className="relative aspect-square bg-[#FCEEE8]">
              {p.image ? (
                <Image
                  src={p.image}
                  alt={p.nom}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 50vw, 25vw"
                  loading="lazy"
                />
              ) : null}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-zinc-900 line-clamp-1">{p.nom}</p>
              <p className="text-sm font-bold text-zinc-900 mt-1">
                {p.prix.toLocaleString('fr-FR')} GN
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
