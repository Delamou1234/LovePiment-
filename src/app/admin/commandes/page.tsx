'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, ThumbsDown, ThumbsUp, Truck, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CommandeAdmin = {
  id: string;
  clientNom: string;
  clientTelephone: string;
  clientVille: string;
  statut: string;
  modePaiement: string;
  statutPaiement: string;
  montantTotal: string;
  createdAt: string;
  suiviToken?: string;
  suiviResume?: string;
  satisfaction?: {
    statut: 'SATISFAIT' | 'NON_SATISFAIT';
    commentaire: string | null;
    date: string;
  } | null;
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
  'LIVREE',
  'ANNULEE',
] as const;

export default function AdminCommandesPage() {
  const [commandes, setCommandes] = useState<CommandeAdmin[]>([]);
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cmdRes, trRes] = await Promise.all([
        fetch('/api/admin/commandes'),
        fetch('/api/admin/transporteurs'),
      ]);
      if (cmdRes.ok) {
        const data = await cmdRes.json();
        setCommandes(data.commandes ?? []);
      }
      if (trRes.ok) {
        const data = await trRes.json();
        setTransporteurs(data.transporteurs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Commandes & livraisons</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Mettez à jour le statut, assignez un transporteur et déclenchez les notifications client.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

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

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : commandes.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucune commande.</p>
      ) : (
        <div className="space-y-4">
          {commandes.map((cmd) => (
            <article
              key={cmd.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-zinc-400">#{cmd.id.slice(0, 10)}</p>
                  <p className="font-semibold text-zinc-900">{cmd.clientNom}</p>
                  <p className="text-xs text-zinc-500">
                    {cmd.clientTelephone} · {cmd.clientVille}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{cmd.suiviResume}</p>
                  {cmd.satisfaction && (
                    <p
                      className={`inline-flex items-center gap-1 text-xs font-medium mt-2 ${
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
                <div className="text-right text-sm">
                  <p className="font-bold text-zinc-900">
                    {Number(cmd.montantTotal).toLocaleString('fr-FR')} GN
                  </p>
                  <p className="text-xs text-zinc-400">{cmd.statut}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {cmd.modePaiement === 'PAIEMENT_LIVRAISON'
                      ? 'Paiement livraison'
                      : 'CinetPay'}
                    {' · '}
                    {cmd.statutPaiement === 'REUSSIE' ? 'Payé' : 'En attente'}
                  </p>
                  {cmd.suiviToken && (
                    <Link
                      href={`/suivi/${cmd.suiviToken}`}
                      target="_blank"
                      className="text-xs text-[#4a5240] hover:underline mt-1 inline-block"
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
                    Paiement reçu (livreur)
                  </Button>
                )}

              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  defaultValue={cmd.statut}
                  className="input-kabishop text-sm"
                  onChange={(e) =>
                    mettreAJour(cmd.id, { statut: e.target.value })
                  }
                  disabled={savingId === cmd.id}
                >
                  {STATUTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  className="input-kabishop text-sm"
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
                    className="input-kabishop text-sm flex-1"
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
    </div>
  );
}
