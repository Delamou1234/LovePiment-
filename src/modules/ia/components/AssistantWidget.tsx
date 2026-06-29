'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera, Heart, Loader2, Search, Upload, X } from 'lucide-react';
import { getCartProductIds, getViewedProductIds } from '@/shared/hooks/useViewedProducts';
import {
  BEAUTY_PROFILE_UPDATED_EVENT,
  encoderProfilBeautePourApi,
  lireProfilBeauteLocal,
} from '@/modules/ia/lib/beauty-profile';
import type { ProduitRecommande } from '@/modules/ia/types';

type Tab = 'recommendations' | 'image';

type ImageSearchResult = {
  id: string;
  nom: string;
  slug: string;
  prix: number;
  image: string | null;
  categorie: string;
};

interface AssistantWidgetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AssistantWidget({ open: openProp, onOpenChange }: AssistantWidgetProps = {}) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  const [tab, setTab] = useState<Tab>('recommendations');
  const [products, setProducts] = useState<ProduitRecommande[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageResults, setImageResults] = useState<ImageSearchResult[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');

  const loadRecommendations = useCallback(async () => {
    setRecsLoading(true);
    try {
      const viewed = getViewedProductIds();
      const cart = getCartProductIds();
      const beautyProfile = lireProfilBeauteLocal();
      const params = new URLSearchParams();
      if (viewed.length) params.set('viewed', viewed.join(','));
      if (cart.length) params.set('cart', cart.join(','));
      const encodedProfile = encoderProfilBeautePourApi(beautyProfile);
      if (encodedProfile) params.set('profile', encodedProfile);
      params.set('limit', '6');

      const res = await fetch(`/api/ia/recommendations?${params}`);
      const data = res.ok ? await res.json() : { products: [] };
      setProducts(data.products ?? []);
    } catch {
      setProducts([]);
    } finally {
      setRecsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadRecommendations();
  }, [open, refreshKey, loadRecommendations]);

  useEffect(() => {
    const onUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener(BEAUTY_PROFILE_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(BEAUTY_PROFILE_UPDATED_EVENT, onUpdate);
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const clearImageSearch = useCallback(() => {
    setImageResults([]);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const searchByImage = useCallback(
    async (file: File) => {
      clearImageSearch();
      setImageError('');
      setTab('image');

      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      setImageLoading(true);

      try {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch('/api/recherche/image', {
          method: 'POST',
          body: formData,
        });

        const data = (await res.json()) as {
          results?: ImageSearchResult[];
          message?: string;
        };

        if (!res.ok) {
          throw new Error(data.message ?? 'Erreur lors de la recherche par image');
        }

        setImageResults(data.results ?? []);
      } catch (err) {
        setImageError(err instanceof Error ? err.message : 'Recherche par image impossible');
        setImageResults([]);
      } finally {
        setImageLoading(false);
      }
    },
    [clearImageSearch],
  );

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void searchByImage(file);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:p-6 pointer-events-none">
      <div
        className="pointer-events-auto flex h-[min(520px,calc(100dvh-5rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#F2D4DC] bg-white shadow-2xl animate-fadeIn"
        role="dialog"
        aria-label="Recommandations et recherche par image"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 shrink-0 bg-[#FFF8F6]">
          <div>
            <p className="font-serif font-bold text-zinc-900 flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-[#9B1B2E]" />
              Trouver mon produit
            </p>
            <p className="text-[10px] text-zinc-400">
              Sélection personnalisée et recherche par photo
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-1.5 hover:bg-zinc-200/60"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-zinc-100 shrink-0">
          <button
            type="button"
            onClick={() => setTab('recommendations')}
            className={`flex-1 px-3 py-2.5 text-xs font-semibold transition ${
              tab === 'recommendations'
                ? 'text-[#9B1B2E] border-b-2 border-[#9B1B2E] bg-white'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Pour vous
          </button>
          <button
            type="button"
            onClick={() => setTab('image')}
            className={`flex-1 px-3 py-2.5 text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              tab === 'image'
                ? 'text-[#9B1B2E] border-b-2 border-[#9B1B2E] bg-white'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            Recherche photo
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {tab === 'recommendations' ? (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">
                Selon votre navigation, votre panier et votre profil intime.
              </p>

              {recsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[#9B1B2E]" />
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/produits/${p.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex flex-col rounded-xl border border-[#F2D4DC] bg-white overflow-hidden hover:border-[#9B1B2E] transition"
                    >
                      <div className="relative aspect-square bg-[#FCEEE8]">
                        {p.image ? (
                          <Image src={p.image} alt="" fill className="object-cover" sizes="160px" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-zinc-300 text-[10px]">
                            Sans image
                          </div>
                        )}
                      </div>
                      <div className="p-2 space-y-0.5">
                        <p className="text-[11px] font-semibold text-zinc-900 line-clamp-2">{p.nom}</p>
                        <p className="text-[10px] font-bold text-[#9B1B2E]">
                          {p.prix.toLocaleString('fr-FR')} GN
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#F2D4DC] bg-[#FFF8F6] px-4 py-8 text-center">
                  <p className="text-sm text-zinc-600">Parcourez la boutique pour affiner vos suggestions.</p>
                  <Link
                    href="/produits"
                    onClick={() => setOpen(false)}
                    className="mt-3 inline-flex text-sm font-semibold text-[#9B1B2E] hover:underline"
                  >
                    Explorer la boutique →
                  </Link>
                </div>
              )}

              <Link
                href="/profil-beaute"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-semibold text-[#9B1B2E] hover:underline pt-1"
              >
                Personnaliser mon profil →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-zinc-500">
                Envoyez une photo d&apos;un produit ou d&apos;un style pour trouver des articles similaires.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleImageFile}
              />

              {!imagePreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#F2D4DC] bg-[#FFF8F6] px-4 py-10 text-zinc-600 hover:border-[#9B1B2E] hover:text-[#9B1B2E] transition"
                >
                  <Upload className="h-8 w-8 text-[#9B1B2E]" />
                  <span className="text-sm font-semibold">Choisir une photo</span>
                  <span className="text-[11px] text-zinc-400">JPG, PNG ou WebP</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#FCEEE8]">
                    <Image src={imagePreview} alt="Aperçu" fill className="object-contain" sizes="360px" />
                    <button
                      type="button"
                      onClick={clearImageSearch}
                      className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white"
                      aria-label="Supprimer la photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {imageLoading ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-500">
                      <Loader2 className="h-4 w-4 animate-spin text-[#9B1B2E]" />
                      Analyse de l&apos;image…
                    </div>
                  ) : imageError ? (
                    <p className="text-sm text-red-500" role="alert">
                      {imageError}
                    </p>
                  ) : imageResults.length > 0 ? (
                    <ul className="space-y-1">
                      {imageResults.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={`/produits/${item.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-xl border border-[#F2D4DC] p-2 hover:border-[#9B1B2E] transition"
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                              {item.image ? (
                                <Image src={item.image} alt="" fill className="object-cover" sizes="48px" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-zinc-300">
                                  <Search className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-zinc-900 line-clamp-1">{item.nom}</p>
                              <p className="text-xs text-zinc-500">{item.categorie}</p>
                            </div>
                            <span className="shrink-0 text-xs font-semibold text-zinc-700">
                              {item.prix.toLocaleString('fr-FR')} GN
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-sm text-zinc-500 py-4">
                      Aucun produit similaire trouvé. Essayez une autre photo.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-center text-xs font-semibold text-[#9B1B2E] hover:underline"
                  >
                    Changer de photo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
