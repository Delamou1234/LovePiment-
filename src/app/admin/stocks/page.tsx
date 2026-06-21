'use client';

import { useCallback, useEffect, useState } from 'react';
import { Boxes, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  useEffect(() => {
    load();
    const interval = setInterval(load, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  const save = async (variantId: string) => {
    setSavingId(variantId);
    try {
      await fetch('/api/admin/stocks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, stock: Number(editing[variantId]) || 0 }),
      });
      await load();
    } finally {
      setSavingId(null);
    }
  };

  const varianteLabel = (s: StockRow) =>
    [s.capacite, s.taille, s.couleur].filter(Boolean).join(' · ') || '—';

  const faible = stocks.filter((s) => s.stock <= 5).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
            <Boxes className="h-6 w-6" />
            Gestion des stocks
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {stocks.length} variante(s) — {faible} en stock faible (≤ 5). Actualisation auto toutes les 30 s.
          </p>
          {lastSync && (
            <p className="text-xs text-zinc-400">
              Dernière sync : {new Date(lastSync).toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {loading && stocks.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Variante</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Code-barres</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {stocks.map((s) => (
                <tr key={s.id} className={s.stock <= 5 ? 'bg-red-50/30' : ''}>
                  <td className="px-4 py-3 font-medium">{s.produit.nom}</td>
                  <td className="px-4 py-3 text-zinc-500">{varianteLabel(s)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{s.sku ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{s.codeBarre ?? '—'}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      className="input-kabishop w-24 py-1.5"
                      value={editing[s.id] ?? s.stock}
                      onChange={(e) =>
                        setEditing((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={savingId === s.id}
                      onClick={() => save(s.id)}
                    >
                      {savingId === s.id ? '…' : 'OK'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
