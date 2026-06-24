'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useState } from 'react';
import { BarChart3, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminGa4Section } from '@/modules/admin/components/dashboard/AdminGa4Section';

type Rapport = {
  periode: string;
  visites: number;
  vuesProduits: number;
  ajoutsPanier: number;
  checkouts: number;
  commandes: number;
  chiffreAffaires: number;
  evenementsParType: { type: string; count: number }[];
  commandesParStatut: { statut: string; count: number }[];
  topProduits: { productId: string; nom: string; vues: number }[];
  visitesParJour: { date: string; count: number }[];
};

const PERIODES = [
  { value: '7j', label: '7 jours' },
  { value: '30j', label: '30 jours' },
  { value: '90j', label: '90 jours' },
] as const;

const TYPE_LABELS: Record<string, string> = {
  PAGE_VIEW: 'Pages vues',
  PRODUCT_VIEW: 'Vues produits',
  ADD_TO_CART: 'Ajouts panier',
  CHECKOUT_START: 'Checkouts',
  ORDER_PLACED: 'Commandes (track)',
};

export default function AdminTraficPage() {
  const [periode, setPeriode] = useState<'7j' | '30j' | '90j'>('7j');
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/rapports?periode=${periode}`);
      if (res.ok) {
        const data = await res.json();
        setRapport(data.rapport);
      }
    } finally {
      setLoading(false);
    }
  }, [periode]);

  useRunAfterMount(() => void load(), [load]);

  const maxVisites = Math.max(...(rapport?.visitesParJour.map((v) => v.count) ?? [1]), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Rapports et statistiques
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Stats internes boutique + Google Analytics 4 pour le marketing.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="input-shop py-2 text-sm"
            value={periode}
            onChange={(e) => setPeriode(e.target.value as typeof periode)}
          >
            {PERIODES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <AdminGa4Section periode={periode} />

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 mb-1">
          Stats internes (base de données)
        </p>
        <p className="text-sm text-zinc-600">
          Événements enregistrés sur le site — complément immédiat aux données GA4.
        </p>
      </div>

      {loading || !rapport ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Visites', value: rapport.visites },
              { label: 'Vues produits', value: rapport.vuesProduits },
              { label: 'Panier', value: rapport.ajoutsPanier },
              { label: 'Checkouts', value: rapport.checkouts },
              { label: 'Commandes', value: rapport.commandes },
              {
                label: 'CA',
                value: `${rapport.chiffreAffaires.toLocaleString('fr-FR')} GN`,
              },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-xs text-zinc-500 uppercase font-bold">{k.label}</p>
                <p className="text-xl font-bold text-zinc-900 mt-1">{k.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h2 className="font-semibold mb-4">Visites par jour</h2>
              <div className="space-y-2">
                {rapport.visitesParJour.map((v) => (
                  <div key={v.date} className="flex items-center gap-3 text-sm">
                    <span className="w-20 text-zinc-500 text-xs">{v.date.slice(5)}</span>
                    <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#9B1B2E] rounded-full"
                        style={{ width: `${(v.count / maxVisites) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium">{v.count}</span>
                  </div>
                ))}
                {rapport.visitesParJour.length === 0 && (
                  <p className="text-sm text-zinc-400">Pas encore de données.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h2 className="font-semibold mb-4">Événements</h2>
              <ul className="space-y-2 text-sm">
                {rapport.evenementsParType.map((e) => (
                  <li key={e.type} className="flex justify-between">
                    <span className="text-zinc-600">{TYPE_LABELS[e.type] ?? e.type}</span>
                    <span className="font-medium">{e.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h2 className="font-semibold mb-4">Commandes par statut</h2>
              <ul className="space-y-2 text-sm">
                {rapport.commandesParStatut.map((c) => (
                  <li key={c.statut} className="flex justify-between">
                    <span className="text-zinc-600">{c.statut.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{c.count}</span>
                  </li>
                ))}
                {rapport.commandesParStatut.length === 0 && (
                  <p className="text-zinc-400">Aucune commande sur la période.</p>
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h2 className="font-semibold mb-4">Top produits consultés</h2>
              <ul className="space-y-2 text-sm">
                {rapport.topProduits.map((p, i) => (
                  <li key={p.productId} className="flex justify-between gap-2">
                    <span className="text-zinc-600 truncate">
                      {i + 1}. {p.nom}
                    </span>
                    <span className="font-medium shrink-0">{p.vues} vues</span>
                  </li>
                ))}
                {rapport.topProduits.length === 0 && (
                  <p className="text-zinc-400">Pas de vues produit enregistrées.</p>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
