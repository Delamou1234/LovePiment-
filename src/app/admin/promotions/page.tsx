'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ProduitPromo = {
  id: string;
  nom: string;
  prix: number;
  prixPromo: number | null;
  promoDebut: string | null;
  promoFin: string | null;
  featured: boolean;
  actif: boolean;
};

export default function AdminPromotionsPage() {
  const [produits, setProduits] = useState<ProduitPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promotions');
      if (res.ok) {
        const data = await res.json();
        setProduits(data.produits ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (p: ProduitPromo) => {
    setSavingId(p.id);
    try {
      await fetch('/api/admin/promotions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: p.id,
          prixPromo: p.prixPromo,
          promoDebut: p.promoDebut,
          promoFin: p.promoFin,
          featured: p.featured,
        }),
      });
      await load();
    } finally {
      setSavingId(null);
    }
  };

  const update = (id: string, field: keyof ProduitPromo, value: unknown) => {
    setProduits((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Tag className="h-6 w-6" />
            Gestion des promotions
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Prix promo, dates et mise en avant (page Promotions de la boutique).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {produits.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 flex flex-col lg:flex-row lg:items-end gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900">{p.nom}</p>
                <p className="text-xs text-zinc-500">
                  Prix normal : {p.prix.toLocaleString('fr-FR')} GN
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                <div>
                  <label className="text-[10px] uppercase text-zinc-400 font-bold">Prix promo</label>
                  <input
                    type="number"
                    className="input-kabishop mt-1 w-full"
                    value={p.prixPromo ?? ''}
                    onChange={(e) =>
                      update(p.id, 'prixPromo', e.target.value ? Number(e.target.value) : null)
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-zinc-400 font-bold">Début</label>
                  <input
                    type="date"
                    className="input-kabishop mt-1 w-full"
                    value={p.promoDebut?.slice(0, 10) ?? ''}
                    onChange={(e) =>
                      update(p.id, 'promoDebut', e.target.value ? `${e.target.value}T00:00:00.000Z` : null)
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-zinc-400 font-bold">Fin</label>
                  <input
                    type="date"
                    className="input-kabishop mt-1 w-full"
                    value={p.promoFin?.slice(0, 10) ?? ''}
                    onChange={(e) =>
                      update(p.id, 'promoFin', e.target.value ? `${e.target.value}T23:59:59.000Z` : null)
                    }
                  />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm pb-2.5">
                    <input
                      type="checkbox"
                      checked={p.featured}
                      onChange={(e) => update(p.id, 'featured', e.target.checked)}
                    />
                    Vedette
                  </label>
                </div>
              </div>
              <Button
                size="sm"
                className="btn-primary shrink-0"
                disabled={savingId === p.id}
                onClick={() => save(p)}
              >
                {savingId === p.id ? '…' : 'Enregistrer'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
