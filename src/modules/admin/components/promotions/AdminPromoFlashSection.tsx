'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { FlashSale, ProduitRef } from '../marketing/marketing-types';

const emptyFlashDraft = () => ({
  titre: '',
  slug: '',
  description: '',
  debut: '',
  fin: '',
  actif: true,
  productIds: [] as string[],
});

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

function isFlashEnCours(f: FlashSale) {
  const now = Date.now();
  return f.actif && new Date(f.debut).getTime() <= now && new Date(f.fin).getTime() >= now;
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = {
  refreshToken?: number;
};

export function AdminPromoFlashSection({ refreshToken = 0 }: Props) {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [produits, setProduits] = useState<ProduitRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreActif, setFiltreActif] = useState<'' | 'actif' | 'inactif'>('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [flashDraft, setFlashDraft] = useState(emptyFlashDraft());
  const [editFlash, setEditFlash] = useState<FlashSale | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, pRes] = await Promise.all([
        fetch('/api/admin/marketing/flash'),
        fetch('/api/admin/produits'),
      ]);
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
    void load();
  }, [load, refreshToken]);

  const flashStats = useMemo(
    () => ({
      total: flashSales.length,
      actives: flashSales.filter((f) => f.actif).length,
      enCours: flashSales.filter(isFlashEnCours).length,
      produits: flashSales.reduce((s, f) => s + f.productIds.length, 0),
    }),
    [flashSales],
  );

  const flashFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return flashSales.filter((f) => {
      if (filtreActif === 'actif' && !f.actif) return false;
      if (filtreActif === 'inactif' && f.actif) return false;
      if (!q) return true;
      return f.titre.toLowerCase().includes(q) || f.slug.toLowerCase().includes(q);
    });
  }, [flashSales, recherche, filtreActif]);

  const creerFlash = async () => {
    setActionId('create-flash');
    try {
      await fetch('/api/admin/marketing/flash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flashDraft),
      });
      setFlashDraft(emptyFlashDraft());
      await load();
    } finally {
      setActionId(null);
    }
  };

  const sauverFlash = async (data: FlashSale) => {
    setActionId(data.id);
    try {
      await fetch('/api/admin/marketing/flash', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.id,
          titre: data.titre,
          slug: data.slug,
          description: data.description,
          debut: data.debut,
          fin: data.fin,
          actif: data.actif,
          productIds: data.productIds,
        }),
      });
      setEditFlash(null);
      await load();
    } finally {
      setActionId(null);
    }
  };

  const toggleFlash = async (f: FlashSale) => {
    setActionId(f.id);
    try {
      await fetch('/api/admin/marketing/flash', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: f.id, actif: !f.actif }),
      });
      await load();
    } finally {
      setActionId(null);
    }
  };

  const supprimerFlash = async (id: string) => {
    if (!confirm('Supprimer cette vente flash ?')) return;
    setActionId(id);
    try {
      await fetch(`/api/admin/marketing/flash?id=${id}`, { method: 'DELETE' });
      await load();
    } finally {
      setActionId(null);
    }
  };

  const inputClass = 'admin-marketing-input';

  return (
    <>
      <div className="admin-marketing-stats">
        <div className="admin-marketing-stat">
          <span className="admin-marketing-stat-value">{flashStats.total}</span>
          <span className="admin-marketing-stat-label">Ventes flash</span>
        </div>
        <div className="admin-marketing-stat is-approved">
          <span className="admin-marketing-stat-value">{flashStats.actives}</span>
          <span className="admin-marketing-stat-label">Actives</span>
        </div>
        <div className="admin-marketing-stat is-pending">
          <span className="admin-marketing-stat-value">{flashStats.enCours}</span>
          <span className="admin-marketing-stat-label">En cours</span>
        </div>
        <div className="admin-marketing-stat">
          <span className="admin-marketing-stat-value">{flashStats.produits}</span>
          <span className="admin-marketing-stat-label">Produits liés</span>
        </div>
      </div>

      <div className="admin-marketing-create-card">
        <p className="admin-marketing-create-title">Nouvelle vente flash</p>
        <p className="text-xs text-zinc-500 mb-3">
          Mise en avant temporaire sur la page Promotions de la boutique.
        </p>
        <div className="admin-marketing-create-grid is-flash">
          <input
            placeholder="Titre"
            value={flashDraft.titre}
            onChange={(e) => setFlashDraft({ ...flashDraft, titre: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Slug (vente-flash-juin)"
            value={flashDraft.slug}
            onChange={(e) => setFlashDraft({ ...flashDraft, slug: e.target.value })}
            className={inputClass}
          />
          <input
            type="datetime-local"
            value={flashDraft.debut}
            onChange={(e) => setFlashDraft({ ...flashDraft, debut: e.target.value })}
            className={inputClass}
          />
          <input
            type="datetime-local"
            value={flashDraft.fin}
            onChange={(e) => setFlashDraft({ ...flashDraft, fin: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="admin-marketing-products-pick">
          <p className="text-xs font-semibold text-zinc-500 mb-2">Produits inclus</p>
          <div className="admin-marketing-products-list">
            {produits.map((p) => (
              <label key={p.id} className="admin-marketing-product-check">
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
                <span className="truncate">{p.nom}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={creerFlash}
          disabled={!flashDraft.titre || !flashDraft.slug || actionId === 'create-flash'}
          className="admin-marketing-create-btn is-wide"
        >
          {actionId === 'create-flash' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Créer la vente flash
        </button>
      </div>

      <div className="admin-marketing-toolbar">
        <div className="admin-marketing-search-wrap">
          <Search className="admin-marketing-search-icon" strokeWidth={1.75} />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une vente flash…"
            className="admin-marketing-search"
          />
        </div>
        <div className="admin-marketing-filters">
          {[
            { id: '' as const, label: 'Tous' },
            { id: 'actif' as const, label: 'Actifs' },
            { id: 'inactif' as const, label: 'Inactifs' },
          ].map(({ id, label }) => (
            <button
              key={id || 'all'}
              type="button"
              onClick={() => setFiltreActif(id)}
              className={`admin-marketing-filter ${filtreActif === id ? 'is-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-marketing-table-card">
        {loading ? (
          <div className="admin-marketing-empty">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : flashFiltres.length === 0 ? (
          <p className="admin-marketing-empty-text">Aucune vente flash trouvée.</p>
        ) : (
          <>
            <div className="admin-marketing-table-wrap">
              <table className="admin-marketing-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Slug</th>
                    <th>Produits</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Statut</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flashFiltres.map((f) => {
                    const busy = actionId === f.id;
                    const enCours = isFlashEnCours(f);
                    return (
                      <tr key={f.id}>
                        <td className="font-semibold text-zinc-900">{f.titre}</td>
                        <td>
                          <code className="text-xs text-zinc-500">{f.slug}</code>
                        </td>
                        <td>
                          <span className="font-medium">{f.productIds.length}</span>
                          <span className="text-zinc-400 text-xs"> produit(s)</span>
                        </td>
                        <td className="text-xs text-zinc-500 whitespace-nowrap">
                          {formatDate(f.debut)}
                        </td>
                        <td className="text-xs text-zinc-500 whitespace-nowrap">
                          {formatDate(f.fin)}
                        </td>
                        <td>
                          <span
                            className={`admin-marketing-badge ${
                              enCours ? 'is-live' : f.actif ? 'is-active' : 'is-inactive'
                            }`}
                          >
                            {enCours ? 'En cours' : f.actif ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-marketing-actions">
                            <Link
                              href="/promos"
                              target="_blank"
                              title="Voir sur la boutique"
                              className="admin-marketing-action"
                            >
                              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                            </Link>
                            <button
                              type="button"
                              title="Modifier"
                              onClick={() => setEditFlash({ ...f })}
                              className="admin-marketing-action"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              title={f.actif ? 'Désactiver' : 'Activer'}
                              disabled={busy}
                              onClick={() => toggleFlash(f)}
                              className="admin-marketing-action"
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Power className="h-4 w-4" strokeWidth={1.75} />
                              )}
                            </button>
                            <button
                              type="button"
                              title="Supprimer"
                              disabled={busy}
                              onClick={() => supprimerFlash(f.id)}
                              className="admin-marketing-action is-delete"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="admin-marketing-footer">
              {flashFiltres.length} vente{flashFiltres.length > 1 ? 's' : ''} flash
            </p>
          </>
        )}
      </div>

      {editFlash && (
        <div className="admin-marketing-modal-backdrop" onClick={() => setEditFlash(null)}>
          <div className="admin-marketing-modal is-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-marketing-modal-head">
              <h2>Modifier la vente flash</h2>
              <button type="button" onClick={() => setEditFlash(null)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="admin-marketing-modal-body">
              <label className="admin-marketing-field">
                <span>Titre</span>
                <input
                  value={editFlash.titre}
                  onChange={(e) => setEditFlash({ ...editFlash, titre: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="admin-marketing-field">
                <span>Slug</span>
                <input
                  value={editFlash.slug}
                  onChange={(e) => setEditFlash({ ...editFlash, slug: e.target.value })}
                  className={inputClass}
                />
              </label>
              <div className="admin-marketing-modal-grid">
                <label className="admin-marketing-field">
                  <span>Début</span>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocal(editFlash.debut)}
                    onChange={(e) => setEditFlash({ ...editFlash, debut: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="admin-marketing-field">
                  <span>Fin</span>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocal(editFlash.fin)}
                    onChange={(e) => setEditFlash({ ...editFlash, fin: e.target.value })}
                    className={inputClass}
                  />
                </label>
              </div>
              <div className="admin-marketing-products-pick">
                <p className="text-xs font-semibold text-zinc-500 mb-2">Produits</p>
                <div className="admin-marketing-products-list">
                  {produits.map((p) => (
                    <label key={p.id} className="admin-marketing-product-check">
                      <input
                        type="checkbox"
                        checked={editFlash.productIds.includes(p.id)}
                        onChange={(e) => {
                          setEditFlash({
                            ...editFlash,
                            productIds: e.target.checked
                              ? [...editFlash.productIds, p.id]
                              : editFlash.productIds.filter((id) => id !== p.id),
                          });
                        }}
                      />
                      <span className="truncate">{p.nom}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="admin-marketing-modal-actions">
              <button
                type="button"
                onClick={() => sauverFlash(editFlash)}
                className="admin-marketing-modal-btn is-primary"
              >
                <Check className="h-4 w-4" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
