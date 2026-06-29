'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, Loader2, MapPin, Route, Truck } from 'lucide-react';
import { CourierOrderCard } from '@/modules/livraison/components/CourierOrderCard';
import { CourierSidebar } from '@/modules/livraison/components/CourierSidebar';
import { CourierTopBar } from '@/modules/livraison/components/CourierTopBar';
import {
  COMPTE_CARD,
  COMPTE_CARD_PAD,
  COMPTE_MAIN,
  COMPTE_MAIN_SCROLL,
  COMPTE_SECTION_DESC,
  COMPTE_SECTION_TITLE,
  COMPTE_SHELL,
  type CourierProfil,
} from '@/modules/livraison/components/livreur-ui';
import type {
  CourierLivraisonIsoleDto,
  CourierTourneeDto,
  CourierTotauxDto,
} from '@/modules/livraison/services/courier-order.service';
import { confirmAction, confirmDeliveryCopy, confirmPickupCopy } from '@/shared/lib/confirm-action';
import { confirmLogout } from '@/shared/lib/confirm-logout';
import { CourierTotalsBanner, TOTAUX_LIVREUR_VIDES } from '@/modules/livraison/components/CourierTotalsBanner';

function StatCard({
  icon: Icon,
  label,
  value,
  iconClass,
  hint,
}: {
  icon: typeof Truck;
  label: string;
  value: string | number;
  iconClass: string;
  hint?: string;
}) {
  return (
    <div className={`${COMPTE_CARD} p-4 flex flex-col gap-3`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-900">{value}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
        {hint && <p className="text-[11px] text-zinc-400 mt-1">{hint}</p>}
      </div>
    </div>
  );
}

export function CourierPageContent() {
  const router = useRouter();
  const [profil, setProfil] = useState<CourierProfil | null>(null);
  const [tournees, setTournees] = useState<CourierTourneeDto[]>([]);
  const [livraisonsIsoles, setLivraisonsIsoles] = useState<CourierLivraisonIsoleDto[]>([]);
  const [totaux, setTotaux] = useState<CourierTotauxDto>(TOTAUX_LIVREUR_VIDES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const redirectingRef = useRef(false);

  const totalArrets =
    tournees.reduce((n, t) => n + t.commandesCount, 0) + livraisonsIsoles.length;
  const especesTotal =
    tournees.reduce((n, t) => n + t.especesAEncaisser, 0) +
    livraisonsIsoles.reduce((n, l) => n + l.especesAEncaisser, 0);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch('/api/livreur/commandes', { credentials: 'include' });
      if (res.status === 401) {
        if (!redirectingRef.current) {
          redirectingRef.current = true;
          router.replace('/connexion?redirect=/livreur');
        }
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setProfil(data.profil as CourierProfil);
        setTournees(data.tournees ?? []);
        setLivraisonsIsoles(data.livraisonsIsoles ?? []);
        setTotaux(data.totaux ?? TOTAUX_LIVREUR_VIDES);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useRunAfterMount(() => void load(), [load]);

  const handleLogout = async () => {
    if (!(await confirmLogout('courier'))) return;
    await fetch('/api/auth/logout?role=courier', { method: 'POST', credentials: 'include' });
    router.replace('/connexion');
  };

  const trouverCommande = (id: string) => {
    for (const tournee of tournees) {
      const cmd = tournee.commandes.find((c) => c.id === id);
      if (cmd) return cmd;
    }
    const iso = livraisonsIsoles.find((l) => l.id === id);
    return iso?.commande ?? null;
  };

  const marquerPriseEnCharge = async (id: string) => {
    const cmd = trouverCommande(id);
    if (!cmd) return;

    const confirmed = await confirmAction(confirmPickupCopy(cmd.clientNom));
    if (!confirmed) return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/livreur/commandes/${id}/prise-en-charge`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? 'Impossible de confirmer la prise en charge.');
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const marquerLivree = async (id: string, paiementRecu?: boolean) => {
    const cmd = trouverCommande(id);
    if (!cmd) return;

    const confirmed = await confirmAction(
      confirmDeliveryCopy(cmd.clientNom, paiementRecu),
    );
    if (!confirmed) return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/livreur/commandes/${id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paiementRecu !== undefined ? { paiementRecu } : {}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? 'Impossible de valider la livraison.');
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (loading || !profil) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-cream">
        <Loader2 className="h-8 w-8 animate-spin text-olive" />
        <p className="text-sm text-zinc-500">Chargement de vos livraisons…</p>
      </div>
    );
  }

  return (
    <div className={`${COMPTE_SHELL} animate-fadeIn`}>
      <CourierSidebar
        profil={profil}
        arretsCount={totalArrets}
        totaux={totaux}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className={COMPTE_MAIN}>
        <CourierTopBar
          profil={profil}
          title="En cours"
          subtitle="Espace livreur"
          tourneesCount={tournees.length}
          arretsCount={totalArrets}
          especesTotal={especesTotal}
          totaux={totaux}
          onLogout={handleLogout}
          onRefresh={() => void load(true)}
          onMenuOpen={() => setMobileMenuOpen(true)}
          refreshing={refreshing}
        />
        <CourierTotalsBanner totaux={totaux} />

        <div className={COMPTE_MAIN_SCROLL}>
          <header className="mb-6 hidden lg:block">
            <h1 className={COMPTE_SECTION_TITLE}>Mes livraisons</h1>
            <p className={COMPTE_SECTION_DESC}>
              Tournées et arrêts assignés. Le montant total est affiché par tournée — le détail par
              commande est réservé à l&apos;administration.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-3 mb-6">
            <StatCard
              icon={Route}
              label="Tournées actives"
              value={tournees.length}
              iconClass="bg-olive/10 text-olive"
            />
            <StatCard
              icon={MapPin}
              label="Arrêts à effectuer"
              value={totalArrets}
              iconClass="bg-sky-50 text-sky-700"
            />
            <StatCard
              icon={Banknote}
              label="Total livré"
              value={`${totaux.montantTermineGn.toLocaleString('fr-FR')} GN`}
              iconClass="bg-emerald-50 text-emerald-700"
              hint={`${totaux.livraisonsTerminees} livraison${totaux.livraisonsTerminees > 1 ? 's' : ''} terminée${totaux.livraisonsTerminees > 1 ? 's' : ''}`}
            />
          </div>

          {totaux.especesAEncaisserGn > 0 && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="font-semibold">Espèces à encaisser : </span>
              {totaux.especesAEncaisserGn.toLocaleString('fr-FR')} GN — signalez le paiement à chaque
              livraison.
            </div>
          )}

          {totalArrets === 0 ? (
            <div className={`${COMPTE_CARD} py-16 text-center`}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-olive/10 text-olive">
                <Truck className="h-7 w-7" />
              </div>
              <p className="text-sm font-semibold text-zinc-800">Aucune livraison assignée</p>
              <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
                Revenez plus tard ou contactez l&apos;administration si vous pensez qu&apos;il s&apos;agit
                d&apos;une erreur.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {tournees.map((tournee) => (
                <section key={tournee.id} className={`${COMPTE_CARD} ${COMPTE_CARD_PAD} space-y-4`}>
                  <div className="flex flex-wrap justify-between gap-3 border-b border-beige-border/60 pb-4">
                    <div>
                      <p className="font-serif text-lg font-bold text-zinc-900">{tournee.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {tournee.commandesCount} arrêt{tournee.commandesCount > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-zinc-900">
                        {tournee.montantTotal.toLocaleString('fr-FR')} GN
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-zinc-500">Total tournée</p>
                      {tournee.especesAEncaisser > 0 && (
                        <p className="text-xs font-semibold text-amber-800 mt-1">
                          Espèces : {tournee.especesAEncaisser.toLocaleString('fr-FR')} GN
                        </p>
                      )}
                      {tournee.primeTotal > 0 && (
                        <p className="text-xs font-semibold text-violet-800 mt-1">
                          Primes : {tournee.primeTotal.toLocaleString('fr-FR')} GN
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {tournee.commandes.map((cmd) => (
                      <CourierOrderCard
                        key={cmd.id}
                        cmd={cmd}
                        busyId={busyId}
                        onPriseEnCharge={marquerPriseEnCharge}
                        onLivrer={marquerLivree}
                        showOrdre
                      />
                    ))}
                  </div>
                </section>
              ))}

              {livraisonsIsoles.length > 0 && (
                <section className="space-y-4">
                  {tournees.length > 0 && (
                    <h2 className="text-sm font-semibold text-zinc-700 px-1">Livraisons individuelles</h2>
                  )}
                  {livraisonsIsoles.map((liv) => (
                    <div key={liv.id} className={`${COMPTE_CARD} ${COMPTE_CARD_PAD} space-y-3`}>
                      <div className="flex justify-between items-center border-b border-beige-border/60 pb-3">
                        <p className="font-semibold text-zinc-900">Livraison</p>
                        <div className="text-right">
                          <p className="font-bold text-zinc-900">
                            {liv.montantTotal.toLocaleString('fr-FR')} GN
                          </p>
                          {liv.especesAEncaisser > 0 && (
                            <p className="text-xs text-amber-800">
                              Espèces : {liv.especesAEncaisser.toLocaleString('fr-FR')} GN
                            </p>
                          )}
                        </div>
                      </div>
                      <CourierOrderCard
                        cmd={liv.commande}
                        busyId={busyId}
                        onPriseEnCharge={marquerPriseEnCharge}
                        onLivrer={marquerLivree}
                      />
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
