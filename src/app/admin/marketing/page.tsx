'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Megaphone, Plus, RefreshCw, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Coupon = {
  id: string;
  code: string;
  type: 'POURCENT' | 'MONTANT_FIXE';
  valeur: number;
  minCommande: number | null;
  maxUtilisations: number | null;
  utilisations: number;
  actif: boolean;
  debut: string | null;
  fin: string | null;
};

type FlashSale = {
  id: string;
  titre: string;
  slug: string;
  description: string | null;
  debut: string;
  fin: string;
  actif: boolean;
  productIds: string[];
};

type ProduitRef = { id: string; nom: string };

const emptyCoupon = (): Omit<Coupon, 'id' | 'utilisations'> => ({
  code: '',
  type: 'POURCENT',
  valeur: 10,
  minCommande: null,
  maxUtilisations: null,
  actif: true,
  debut: null,
  fin: null,
});

export default function AdminMarketingPage() {
  const [tab, setTab] = useState<'coupons' | 'flash'>('coupons');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [produits, setProduits] = useState<ProduitRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(emptyCoupon());
  const [flashDraft, setFlashDraft] = useState({
    titre: '',
    slug: '',
    description: '',
    debut: '',
    fin: '',
    actif: true,
    productIds: [] as string[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, fRes, pRes] = await Promise.all([
        fetch('/api/admin/marketing/coupons'),
        fetch('/api/admin/marketing/flash'),
        fetch('/api/admin/produits'),
      ]);
      if (cRes.ok) {
        const data = await cRes.json();
        setCoupons(data.coupons ?? []);
      }
      if (fRes.ok) {
        const data = await fRes.json();
        setFlashSales(data.flashSales ?? []);
      }
      if (pRes.ok) {
        const data = await pRes.json();
        setProduits(
          (data.produits ?? []).map((p: { id: string; nom: string }) => ({
            id: p.id,
            nom: p.nom,
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const creerCoupon = async () => {
    await fetch('/api/admin/marketing/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setDraft(emptyCoupon());
    await load();
  };

  const toggleCoupon = async (c: Coupon) => {
    await fetch('/api/admin/marketing/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, actif: !c.actif }),
    });
    await load();
  };

  const supprimerCoupon = async (id: string) => {
    await fetch(`/api/admin/marketing/coupons?id=${id}`, { method: 'DELETE' });
    await load();
  };

  const creerFlash = async () => {
    await fetch('/api/admin/marketing/flash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flashDraft),
    });
    setFlashDraft({
      titre: '',
      slug: '',
      description: '',
      debut: '',
      fin: '',
      actif: true,
      productIds: [],
    });
    await load();
  };

  const supprimerFlash = async (id: string) => {
    await fetch(`/api/admin/marketing/flash?id=${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Marketing
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Coupons, ventes flash, fidélité et parrainage (règles intégrées au checkout).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('coupons')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === 'coupons' ? 'bg-[#4a5240] text-white' : 'bg-white border border-zinc-200'
          }`}
        >
          Coupons
        </button>
        <button
          type="button"
          onClick={() => setTab('flash')}
          className={`rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-1 ${
            tab === 'flash' ? 'bg-[#4a5240] text-white' : 'bg-white border border-zinc-200'
          }`}
        >
          <Zap className="h-4 w-4" /> Ventes flash
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : tab === 'coupons' ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              placeholder="Code (BIENVENUE10)"
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
            <select
              value={draft.type}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as Coupon['type'] })
              }
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="POURCENT">Pourcentage</option>
              <option value="MONTANT_FIXE">Montant fixe (GN)</option>
            </select>
            <input
              type="number"
              placeholder="Valeur"
              value={draft.valeur}
              onChange={(e) => setDraft({ ...draft, valeur: Number(e.target.value) })}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
            <Button onClick={creerCoupon} disabled={!draft.code.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Créer
            </Button>
          </div>

          <div className="space-y-3">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-zinc-900">{c.code}</p>
                  <p className="text-xs text-zinc-500">
                    {c.type === 'POURCENT' ? `${c.valeur}%` : `${c.valeur.toLocaleString('fr-FR')} GN`}
                    {' · '}
                    {c.utilisations}
                    {c.maxUtilisations != null ? ` / ${c.maxUtilisations}` : ''} utilisations
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleCoupon(c)}>
                    {c.actif ? 'Désactiver' : 'Activer'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => supprimerCoupon(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {coupons.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-8">Aucun coupon.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <input
                placeholder="Titre"
                value={flashDraft.titre}
                onChange={(e) => setFlashDraft({ ...flashDraft, titre: e.target.value })}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="Slug (vente-flash-juin)"
                value={flashDraft.slug}
                onChange={(e) => setFlashDraft({ ...flashDraft, slug: e.target.value })}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
              <input
                type="datetime-local"
                value={flashDraft.debut}
                onChange={(e) => setFlashDraft({ ...flashDraft, debut: e.target.value })}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
              <input
                type="datetime-local"
                value={flashDraft.fin}
                onChange={(e) => setFlashDraft({ ...flashDraft, fin: e.target.value })}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-2">Produits inclus</p>
              <div className="max-h-40 overflow-y-auto grid sm:grid-cols-2 gap-1">
                {produits.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={flashDraft.productIds.includes(p.id)}
                      onChange={(e) => {
                        setFlashDraft({
                          ...flashDraft,
                          productIds: e.target.checked
                            ? [...flashDraft.productIds, p.id]
                            : flashDraft.productIds.filter((id) => id !== p.id),
                        });
                      }}
                    />
                    {p.nom}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={creerFlash} disabled={!flashDraft.titre || !flashDraft.slug}>
              <Plus className="h-4 w-4 mr-1" /> Créer la vente flash
            </Button>
          </div>

          <div className="space-y-3">
            {flashSales.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 flex flex-wrap justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-zinc-900">{f.titre}</p>
                  <p className="text-xs text-zinc-500">
                    /promos · {f.productIds.length} produit(s) ·{' '}
                    {f.actif ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => supprimerFlash(f.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
