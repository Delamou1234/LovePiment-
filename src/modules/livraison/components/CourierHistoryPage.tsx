'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, History, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourierDeliveredOrderCard } from '@/modules/livraison/components/CourierDeliveredOrderCard';
import { CourierMobileNav, CourierSidebar } from '@/modules/livraison/components/CourierSidebar';
import { CourierTopBar } from '@/modules/livraison/components/CourierTopBar';
import {
  COMPTE_CARD,
  COMPTE_MAIN,
  COMPTE_MAIN_SCROLL,
  COMPTE_SECTION_DESC,
  COMPTE_SECTION_TITLE,
  COMPTE_SHELL,
  type CourierProfil,
} from '@/modules/livraison/components/livreur-ui';
import type { CourierHistoriqueDto } from '@/modules/livraison/services/courier-order.service';
import { confirmLogout } from '@/shared/lib/confirm-logout';

export function CourierHistoryPage() {
  const router = useRouter();
  const [profil, setProfil] = useState<CourierProfil | null>(null);
  const [livraisons, setLivraisons] = useState<CourierHistoriqueDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const redirectingRef = useRef(false);

  const loadProfil = useCallback(async () => {
    const res = await fetch('/api/livreur/commandes', { credentials: 'include' });
    if (res.status === 401) {
      if (!redirectingRef.current) {
        redirectingRef.current = true;
        router.replace('/connexion?redirect=/livreur/historique');
      }
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    return data.profil as CourierProfil;
  }, [router]);

  const loadHistorique = useCallback(
    async (pageNum: number, silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await fetch(`/api/livreur/commandes/historique?page=${pageNum}&limit=30`, {
          credentials: 'include',
        });
        if (res.status === 401) {
          if (!redirectingRef.current) {
            redirectingRef.current = true;
            router.replace('/connexion?redirect=/livreur/historique');
          }
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setLivraisons(data.livraisons ?? []);
          setTotalPages(data.pagination?.totalPages ?? 1);
          setTotal(data.pagination?.total ?? 0);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router],
  );

  useEffect(() => {
    void loadProfil().then((p) => {
      if (p) setProfil(p);
    });
  }, [loadProfil]);

  useEffect(() => {
    if (!profil) return;
    void loadHistorique(page, page > 1);
  }, [profil, page, loadHistorique]);

  const handleLogout = async () => {
    if (!(await confirmLogout('courier'))) return;
    await fetch('/api/auth/logout?role=courier', { method: 'POST', credentials: 'include' });
    router.replace('/connexion');
  };

  const refresh = () => void loadHistorique(page, true);

  if (loading && !profil) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-cream">
        <Loader2 className="h-8 w-8 animate-spin text-olive" />
        <p className="text-sm text-zinc-500">Chargement de l&apos;historique…</p>
      </div>
    );
  }

  if (!profil) return null;

  return (
    <div className={`${COMPTE_SHELL} animate-fadeIn`}>
      <CourierSidebar
        profil={profil}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className={COMPTE_MAIN}>
        <CourierMobileNav title="Historique" onMenuOpen={() => setMobileMenuOpen(true)} />
        <CourierTopBar
          profil={profil}
          title="Historique"
          subtitle="Livraisons terminées"
          tourneesCount={0}
          arretsCount={0}
          especesTotal={0}
          onLogout={handleLogout}
          onRefresh={refresh}
          refreshing={refreshing}
        />

        <div className={COMPTE_MAIN_SCROLL}>
          <header className="mb-6 hidden lg:block">
            <h1 className={COMPTE_SECTION_TITLE}>Historique des livraisons</h1>
            <p className={COMPTE_SECTION_DESC}>
              Retrouvez toutes les livraisons que vous avez effectuées, avec le détail de chaque
              commande.
            </p>
          </header>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-olive" />
            </div>
          ) : livraisons.length === 0 ? (
            <div className={`${COMPTE_CARD} py-16 text-center`}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-olive/10 text-olive">
                <History className="h-7 w-7" />
              </div>
              <p className="text-sm font-semibold text-zinc-800">Aucune livraison terminée</p>
              <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
                Vos livraisons confirmées apparaîtront ici automatiquement.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500 px-1">
                {total} livraison{total > 1 ? 's' : ''} au total
              </p>
              {livraisons.map((liv) => (
                <CourierDeliveredOrderCard key={liv.id} livraison={liv} />
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 pt-4">
                  <p className="text-xs text-zinc-500">
                    Page {page} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || refreshing}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || refreshing}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
