'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminAssignCourier } from '@/modules/admin/components/commandes/AdminAssignCourier';
import { AdminBatchDelivery } from '@/modules/admin/components/commandes/AdminBatchDelivery';
import { AdminGeoGroupsPanel } from '@/modules/admin/components/commandes/AdminGeoGroupsPanel';
import { AdminOrderStatusBadges } from '@/modules/admin/components/commandes/AdminOrderStatusBadges';
import { AdminTourneesMontants } from '@/modules/admin/components/commandes/AdminTourneesMontants';
import { AdminDeliverySharePanel } from '@/modules/admin/components/commandes/AdminDeliverySharePanel';
import {
  FILTRES_COMMANDE_ADMIN,
  formaterDateCourte,
  type FiltreCommandeAdmin,
} from '@/modules/admin/lib/order-status-labels';

type CommandeAdmin = {
  id: string;
  clientNom: string;
  clientTelephone: string;
  clientAdresse: string;
  clientVille: string;
  statut: string;
  modePaiement: string;
  statutPaiement: string;
  montantTotal: number;
  createdAt: string;
  livreeLe?: string | null;
  itemsCount: number;
  suiviToken?: string;
  suiviResume?: string;
  courierId?: string | null;
  courierNom?: string | null;
  deliveryRunId?: string | null;
  deliveryRunLabel?: string | null;
  ordreLivraison?: number | null;
  assignedAt?: string | null;
  livreurPaiementRecu?: boolean | null;
  penaliteLivreurGn?: number | null;
  satisfaction?: {
    statut: 'SATISFAIT' | 'NON_SATISFAIT';
    commentaire: string | null;
    date: string;
  } | null;
};

type ResumeCommandes = {
  total: number;
  livree: number;
  annulee: number;
  payee: number;
  nonPayee: number;
  nonLivree: number;
  enCours: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Transporteur = {
  id: string;
  nom: string;
  slug: string;
  telephone: string | null;
  delaiMinHeures: number;
  delaiMaxHeures: number;
  actif: boolean;
};

const STATUTS = [
  'EN_ATTENTE',
  'PAYEE',
  'EN_PREPARATION',
  'EXPEDIEE',
  'ANNULEE',
] as const;

function ResumeCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left transition ${
        active
          ? 'border-olive bg-olive/5 ring-1 ring-olive/20'
          : 'border-zinc-200 bg-white hover:border-zinc-300'
      }`}
    >
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </button>
  );
}

export function AdminCommandesPage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId')?.trim() ?? '';
  const clientNom = searchParams.get('clientNom')?.trim() ?? '';
  const [commandes, setCommandes] = useState<CommandeAdmin[]>([]);
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const [resume, setResume] = useState<ResumeCommandes | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filtre, setFiltre] = useState<FiltreCommandeAdmin>('toutes');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tourneesKey, setTourneesKey] = useState(0);
  const [geoKey, setGeoKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        filtre,
        page: String(page),
        limit: '50',
      });
      if (clientId) params.set('clientId', clientId);
      const [cmdRes, trRes] = await Promise.all([
        fetch(`/api/admin/commandes?${params}`),
        fetch('/api/admin/transporteurs'),
      ]);
      if (cmdRes.ok) {
        const data = await cmdRes.json();
        setCommandes(data.commandes ?? []);
        setResume(data.resume ?? null);
        setPagination(data.pagination ?? null);
      }
      if (trRes.ok) {
        const data = await trRes.json();
        setTransporteurs(data.transporteurs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [filtre, page, clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId || loading) return;
    if (commandes.some((c) => c.id === openId)) {
      setExpandedId(openId);
    }
  }, [searchParams, commandes, loading]);

  const changerFiltre = (next: FiltreCommandeAdmin) => {
    setFiltre(next);
    setPage(1);
  };

  const mettreAJour = async (
    id: string,
    data: { statut: string; carrierId?: string | null; numeroSuivi?: string },
  ) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/commandes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, notifier: true }),
      });
      if (res.ok) await load();
    } finally {
      setSavingId(null);
    }
  };

  const confirmerPaiementLivraison = async (id: string) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/commandes/${id}/paiement-livraison`, {
        method: 'POST',
      });
      if (res.ok) await load();
    } finally {
      setSavingId(null);
    }
  };

  const peutSelectionner = (cmd: CommandeAdmin) =>
    !cmd.courierId && cmd.statut !== 'LIVREE' && cmd.statut !== 'ANNULEE';

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Commandes & livraisons</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Vue complète : paiement, livraison, livreur assigné et statut de chaque commande.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {clientId && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pink-200 bg-pink-50/80 px-4 py-3">
          <p className="text-sm text-zinc-700">
            Commandes du client <strong className="text-zinc-900">{clientNom || 'sélectionné'}</strong>
          </p>
          <Link href="/admin/commandes" className="text-sm font-semibold text-olive hover:text-olive-dark">
            Voir toutes les commandes
          </Link>
        </div>
      )}

      {resume && (
        <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
          <ResumeCard
            label="Total"
            value={resume.total}
            active={filtre === 'toutes'}
            onClick={() => changerFiltre('toutes')}
          />
          <ResumeCard
            label="Payées"
            value={resume.payee}
            active={filtre === 'payee'}
            onClick={() => changerFiltre('payee')}
          />
          <ResumeCard
            label="Non payées"
            value={resume.nonPayee}
            active={filtre === 'non_payee'}
            onClick={() => changerFiltre('non_payee')}
          />
          <ResumeCard
            label="Livrées"
            value={resume.livree}
            active={filtre === 'livree'}
            onClick={() => changerFiltre('livree')}
          />
          <ResumeCard
            label="Non livrées"
            value={resume.nonLivree}
            active={filtre === 'non_livree'}
            onClick={() => changerFiltre('non_livree')}
          />
          <ResumeCard
            label="En cours"
            value={resume.enCours}
            active={filtre === 'en_cours'}
            onClick={() => changerFiltre('en_cours')}
          />
          <ResumeCard
            label="Annulées"
            value={resume.annulee}
            active={filtre === 'annulee'}
            onClick={() => changerFiltre('annulee')}
          />
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTRES_COMMANDE_ADMIN.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => changerFiltre(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filtre === f.id
                ? 'bg-olive text-white'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300'
            }`}
          >
            {f.label}
            {pagination && filtre === f.id ? ` (${pagination.total})` : ''}
          </button>
        ))}
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-600">Date</th>
                <th className="px-4 py-3 font-semibold text-zinc-600">Client</th>
                <th className="px-4 py-3 font-semibold text-zinc-600">Montant</th>
                <th className="px-4 py-3 font-semibold text-zinc-600">Paiement</th>
                <th className="px-4 py-3 font-semibold text-zinc-600">Livraison</th>
                <th className="px-4 py-3 font-semibold text-zinc-600">Livreur</th>
                <th className="px-4 py-3 font-semibold text-zinc-600">Statut</th>
                <th className="px-4 py-3 font-semibold text-zinc-600" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : commandes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                    Aucune commande pour ce filtre.
                  </td>
                </tr>
              ) : (
                commandes.map((cmd) => (
                  <tr key={cmd.id} className="border-b border-zinc-100 hover:bg-zinc-50/80">
                    <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                      {formaterDateCourte(cmd.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{cmd.clientNom}</p>
                      <p className="text-xs text-zinc-500">{cmd.clientVille}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      {cmd.montantTotal.toLocaleString('fr-FR')} GN
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          cmd.statutPaiement === 'REUSSIE'
                            ? 'bg-emerald-50 text-emerald-800'
                            : cmd.statutPaiement === 'ECHOUEE'
                              ? 'bg-red-50 text-red-800'
                              : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {cmd.statutPaiement === 'REUSSIE'
                          ? 'Payé'
                          : cmd.statutPaiement === 'ECHOUEE'
                            ? 'Non payé'
                            : 'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          cmd.statut === 'LIVREE'
                            ? 'bg-emerald-50 text-emerald-800'
                            : cmd.statut === 'ANNULEE'
                              ? 'bg-zinc-100 text-zinc-500'
                              : 'bg-orange-50 text-orange-800'
                        }`}
                      >
                        {cmd.statut === 'LIVREE'
                          ? cmd.livreeLe
                            ? `Livrée`
                            : 'Livrée'
                          : cmd.statut === 'ANNULEE'
                            ? 'Annulée'
                            : 'Non livrée'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600">
                      {cmd.courierNom ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-zinc-700">{cmd.statut}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId((id) => (id === cmd.id ? null : cmd.id))
                        }
                        className="text-xs font-semibold text-olive hover:underline"
                      >
                        {expandedId === cmd.id ? 'Fermer' : 'Gérer'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3">
            <p className="text-xs text-zinc-500">
              Page {pagination.page} / {pagination.totalPages} — {pagination.total} commande
              {pagination.total > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Transporteurs ({transporteurs.length})
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {transporteurs.map((t) => (
            <div key={t.id} className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm">
              <p className="font-medium text-zinc-900">{t.nom}</p>
              <p className="text-xs text-zinc-500">
                Délai {t.delaiMinHeures}–{t.delaiMaxHeures}h
                {t.telephone ? ` · ${t.telephone}` : ''}
              </p>
            </div>
          ))}
        </div>
      </section>

      <AdminGeoGroupsPanel
        refreshKey={geoKey}
        onSelectGroup={(ids) => {
          setSelectedIds(ids);
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }}
      />

      <AdminTourneesMontants refreshKey={tourneesKey} />

      {!loading && expandedId && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">Gestion de la commande</h2>
          {commandes
            .filter((cmd) => cmd.id === expandedId)
            .map((cmd) => (
              <article
                key={cmd.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-3 items-start flex-1 min-w-0">
                    {peutSelectionner(cmd) && (
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-zinc-300"
                        checked={selectedIds.includes(cmd.id)}
                        onChange={() => toggleSelection(cmd.id)}
                        aria-label={`Sélectionner ${cmd.clientNom}`}
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <p className="text-xs text-zinc-400">
                          #{cmd.id.slice(0, 10)} · {formaterDateCourte(cmd.createdAt)} ·{' '}
                          {cmd.itemsCount} article{cmd.itemsCount > 1 ? 's' : ''}
                        </p>
                        <p className="font-semibold text-zinc-900">{cmd.clientNom}</p>
                        <p className="text-xs text-zinc-500">
                          {cmd.clientTelephone} · {cmd.clientVille}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">{cmd.clientAdresse}</p>
                      </div>

                      <AdminOrderStatusBadges
                        statut={cmd.statut}
                        statutPaiement={cmd.statutPaiement}
                        modePaiement={cmd.modePaiement}
                        livreeLe={cmd.livreeLe}
                        courierNom={cmd.courierNom}
                        livreurPaiementRecu={cmd.livreurPaiementRecu}
                      />

                      {cmd.suiviResume && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" />
                          {cmd.suiviResume}
                        </p>
                      )}

                      {cmd.satisfaction && (
                        <p
                          className={`inline-flex items-center gap-1 text-xs font-medium ${
                            cmd.satisfaction.statut === 'SATISFAIT'
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {cmd.satisfaction.statut === 'SATISFAIT' ? (
                            <ThumbsUp className="h-3 w-3" />
                          ) : (
                            <ThumbsDown className="h-3 w-3" />
                          )}
                          {cmd.satisfaction.statut === 'SATISFAIT' ? 'Satisfait' : 'Insatisfait'}
                          {cmd.satisfaction.commentaire
                            ? ` — « ${cmd.satisfaction.commentaire} »`
                            : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <p className="font-bold text-zinc-900 text-lg">
                      {cmd.montantTotal.toLocaleString('fr-FR')} GN
                    </p>
                    {cmd.livreeLe && (
                      <p className="text-[11px] text-emerald-700 mt-1">
                        Livrée le {formaterDateCourte(cmd.livreeLe)}
                      </p>
                    )}
                    {cmd.penaliteLivreurGn != null && cmd.penaliteLivreurGn > 0 && (
                      <p className="text-[10px] font-semibold text-red-700 mt-0.5">
                        Pénalité livreur : {cmd.penaliteLivreurGn.toLocaleString('fr-FR')} GN
                      </p>
                    )}
                    {cmd.suiviToken && (
                      <Link
                        href={`/suivi/${cmd.suiviToken}`}
                        target="_blank"
                        className="text-xs text-[#9B1B2E] hover:underline mt-1 inline-block"
                      >
                        Voir suivi client →
                      </Link>
                    )}
                  </div>
                </div>

                {cmd.modePaiement === 'PAIEMENT_LIVRAISON' &&
                  cmd.statutPaiement !== 'REUSSIE' && (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white w-full sm:w-auto"
                      disabled={savingId === cmd.id}
                      onClick={() => confirmerPaiementLivraison(cmd.id)}
                    >
                      <Banknote className="h-4 w-4 mr-1.5" />
                      Confirmer paiement (admin)
                    </Button>
                  )}

                <AdminAssignCourier
                  orderId={cmd.id}
                  courierId={cmd.courierId}
                  courierNom={cmd.courierNom}
                  deliveryRunLabel={cmd.deliveryRunLabel}
                  disabled={
                    savingId === cmd.id || cmd.statut === 'ANNULEE' || cmd.statut === 'LIVREE'
                  }
                  onAssigned={() => {
                    setTourneesKey((k) => k + 1);
                    void load();
                  }}
                />

                <AdminDeliverySharePanel
                  orderId={cmd.id}
                  clientNom={cmd.clientNom}
                  clientTelephone={cmd.clientTelephone}
                  clientAdresse={cmd.clientAdresse}
                  clientVille={cmd.clientVille}
                  montantTotal={String(cmd.montantTotal)}
                  disabled={
                    savingId === cmd.id || cmd.statut === 'ANNULEE' || cmd.statut === 'LIVREE'
                  }
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  {cmd.statut === 'LIVREE' ? (
                    <div className="input-shop text-sm flex items-center bg-emerald-50 text-emerald-800 font-semibold">
                      LIVREE — confirmée par le livreur
                    </div>
                  ) : (
                    <select
                      defaultValue={cmd.statut}
                      className="input-shop text-sm"
                      onChange={(e) => mettreAJour(cmd.id, { statut: e.target.value })}
                      disabled={savingId === cmd.id}
                    >
                      {STATUTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}

                  <select
                    className="input-shop text-sm"
                    defaultValue=""
                    onChange={(e) =>
                      mettreAJour(cmd.id, {
                        statut: cmd.statut,
                        carrierId: e.target.value || null,
                      })
                    }
                    disabled={savingId === cmd.id}
                  >
                    <option value="">Transporteur…</option>
                    {transporteurs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nom}
                      </option>
                    ))}
                  </select>

                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      mettreAJour(cmd.id, {
                        statut: cmd.statut,
                        numeroSuivi: String(fd.get('numeroSuivi') || ''),
                      });
                    }}
                  >
                    <input
                      name="numeroSuivi"
                      placeholder="N° colis"
                      className="input-shop text-sm flex-1"
                    />
                    <Button type="submit" size="sm" variant="outline" disabled={savingId === cmd.id}>
                      OK
                    </Button>
                  </form>
                </div>
              </article>
            ))}
        </div>
      )}

      {!loading && commandes.length > 0 && !expandedId && (
        <p className="text-sm text-zinc-500 text-center py-2">
          Cliquez sur « Gérer » dans le tableau pour assigner un livreur ou modifier une commande.
        </p>
      )}

      <AdminBatchDelivery
        selectedIds={selectedIds}
        disabled={loading}
        onClear={() => setSelectedIds([])}
        onDone={() => {
          setTourneesKey((k) => k + 1);
          setGeoKey((k) => k + 1);
          void load();
        }}
      />
    </div>
  );
}
