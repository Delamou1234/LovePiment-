'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Boxes, Loader2, RefreshCw } from 'lucide-react';
import { isStockFaible, STOCK_FAIBLE_SEUIL } from '@/modules/admin/lib/stock-threshold';
import { useAdminStats } from '@/modules/admin/components/layout/AdminStatsProvider';

type StockRow = {
  id: string;
  taille: string | null;
  couleur: string | null;
  capacite: string | null;
  stock: number;
  sku: string | null;
  codeBarre: string | null;
  produit: { id: string; nom: string; slug: string; actif: boolean };
};

const AUTO_REFRESH_MS = 30_000;

export default function AdminStocksPage() {
  const searchParams = useSearchParams();
  const { refresh: refreshStats } = useAdminStats();
  const filtreFaible = searchParams.get('faible') === '1';
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stocks', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStocks(data.stocks ?? []);
        setLastSync(data.updatedAt ?? new Date().toISOString());
        const init: Record<string, string> = {};
        for (const s of data.stocks ?? []) init[s.id] = String(s.stock);
        setEditing(init);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useRunAfterMount(() => void load(), [load]);

  useEffect(() => {
    const interval = setInterval(load, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#variant-')) return;
    const el = document.querySelector(hash);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [stocks, loading]);

  const stocksAffichés = useMemo(
    () => (filtreFaible ? stocks.filter((s) => isStockFaible(s.stock)) : stocks),
    [stocks, filtreFaible],
  );

  const faible = stocks.filter((s) => isStockFaible(s.stock)).length;

  const save = async (variantId: string) => {
    setSavingId(variantId);
    try {
      await fetch('/api/admin/stocks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, stock: Number(editing[variantId]) || 0 }),
      });
      await load();
      await refreshStats();
    } finally {
      setSavingId(null);
    }
  };

  const varianteLabel = (s: StockRow) =>
    [s.capacite, s.taille, s.couleur].filter(Boolean).join(' · ') || '—';

  return (
    <div className="space-y-6">
      {faible > 0 && (
        <div className="admin-stock-banner" role="alert">
          <div className="admin-stock-banner-inner">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={1.75} />
            <p className="flex-1 text-sm text-amber-950">
              <strong>{faible}</strong> variante{faible > 1 ? 's' : ''} à ≤ {STOCK_FAIBLE_SEUIL}{' '}
              unité{STOCK_FAIBLE_SEUIL > 1 ? 's' : ''}.
              {filtreFaible ? (
                <a href="/admin/stocks" className="ml-1 font-semibold underline underline-offset-2">
                  Voir tout
                </a>
              ) : (
                <a
                  href="/admin/stocks?faible=1"
                  className="ml-1 font-semibold underline underline-offset-2"
                >
                  Filtrer les alertes
                </a>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
            <Boxes className="h-7 w-7 text-[#e91e8c]" strokeWidth={1.75} />
            Gestion des stocks
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {stocks.length} variante(s) —{' '}
            <span className={faible > 0 ? 'font-semibold text-amber-700' : ''}>
              {faible} en stock faible (≤ {STOCK_FAIBLE_SEUIL})
            </span>
            . Actualisation auto toutes les 30 s.
          </p>
          {lastSync && (
            <p className="text-xs text-zinc-400">
              Dernière sync : {new Date(lastSync).toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="admin-marketing-refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {loading && stocks.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="admin-marketing-table-card">
          <div className="admin-marketing-table-wrap">
            <table className="admin-marketing-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Variante</th>
                  <th>SKU</th>
                  <th>Code-barres</th>
                  <th>Stock</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {stocksAffichés.map((s) => (
                  <tr
                    key={s.id}
                    id={`variant-${s.id}`}
                    className={isStockFaible(s.stock) ? 'admin-stock-row-alert' : ''}
                  >
                    <td className="font-medium text-zinc-900">{s.produit.nom}</td>
                    <td className="text-zinc-500">{varianteLabel(s)}</td>
                    <td className="font-mono text-xs text-zinc-500">{s.sku ?? '—'}</td>
                    <td className="font-mono text-xs text-zinc-400">{s.codeBarre ?? '—'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          className="admin-marketing-input w-24 py-1.5"
                          value={editing[s.id] ?? s.stock}
                          onChange={(e) =>
                            setEditing((prev) => ({ ...prev, [s.id]: e.target.value }))
                          }
                        />
                        {isStockFaible(s.stock) && (
                          <span className="admin-stock-pill">
                            {s.stock === 0 ? 'Rupture' : 'Faible'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        disabled={savingId === s.id}
                        onClick={() => save(s.id)}
                        className="admin-marketing-create-btn !py-1.5 !px-3"
                      >
                        {savingId === s.id ? '…' : 'OK'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stocksAffichés.length === 0 && (
            <p className="admin-marketing-empty-text">Aucune variante à afficher.</p>
          )}
        </div>
      )}
    </div>
  );
}
