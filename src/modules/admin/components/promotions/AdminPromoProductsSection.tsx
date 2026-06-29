'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  ExternalLink,
  Loader2,
  Pencil,
  Sparkles,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import type { FiltrePromo, ProduitPromo } from './promotions-types';
import { FilterSearchInput } from '@/shared/components/FilterSearchInput';

function formatGn(value: number) {
  return `${value.toLocaleString('fr-FR')} GN`;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

function toDateInput(iso: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function remisePercent(p: ProduitPromo) {
  if (!p.prixPromo || p.prixPromo >= p.prix) return null;
  return Math.round((1 - p.prixPromo / p.prix) * 100);
}

function isPromoEnCours(p: ProduitPromo) {
  if (!p.prixPromo || p.prixPromo >= p.prix) return false;
  const now = Date.now();
  if (p.promoDebut && new Date(p.promoDebut).getTime() > now) return false;
  if (p.promoFin && new Date(p.promoFin).getTime() < now) return false;
  return true;
}

function hasPromoConfigured(p: ProduitPromo) {
  return p.prixPromo != null && p.prixPromo < p.prix;
}

const FILTRES: { id: FiltrePromo; label: string }[] = [
  { id: '', label: 'Tous' },
  { id: 'en-cours', label: 'En cours' },
  { id: 'promo', label: 'Avec promo' },
  { id: 'sans-promo', label: 'Sans promo' },
  { id: 'vedette', label: 'Vedettes' },
  { id: 'inactif', label: 'Inactifs' },
];

type Props = {
  refreshToken?: number;
};

export function AdminPromoProductsSection({ refreshToken = 0 }: Props) {
  const searchParams = useSearchParams();
  const [produits, setProduits] = useState<ProduitPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<FiltrePromo>('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [editProduit, setEditProduit] = useState<ProduitPromo | null>(null);

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

  useRunAfterMount(() => void load(), [load, refreshToken]);

  useRunAfterMount(() => {
    const editId = searchParams.get('edit');
    if (!editId || loading || editProduit) return;
    const produit = produits.find((p) => p.id === editId);
    if (produit) setEditProduit({ ...produit });
  }, [searchParams, produits, loading, editProduit]);

  const stats = useMemo(
    () => ({
      total: produits.length,
      enCours: produits.filter(isPromoEnCours).length,
      avecPromo: produits.filter(hasPromoConfigured).length,
      vedettes: produits.filter((p) => p.featured).length,
    }),
    [produits],
  );

  const produitsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return produits.filter((p) => {
      if (filtre === 'promo' && !hasPromoConfigured(p)) return false;
      if (filtre === 'sans-promo' && hasPromoConfigured(p)) return false;
      if (filtre === 'en-cours' && !isPromoEnCours(p)) return false;
      if (filtre === 'vedette' && !p.featured) return false;
      if (filtre === 'inactif' && p.actif) return false;
      if (!q) return true;
      return p.nom.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    });
  }, [produits, filtre, recherche]);

  const patchPromo = async (
    productId: string,
    data: {
      prixPromo?: number | null;
      promoDebut?: string | null;
      promoFin?: string | null;
      featured?: boolean;
    },
  ) => {
    setActionId(productId);
    try {
      await fetch('/api/admin/promotions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...data }),
      });
      await load();
    } finally {
      setActionId(null);
    }
  };

  const sauverEdit = async () => {
    if (!editProduit) return;
    await patchPromo(editProduit.id, {
      prixPromo: editProduit.prixPromo,
      promoDebut: editProduit.promoDebut,
      promoFin: editProduit.promoFin,
      featured: editProduit.featured,
    });
    setEditProduit(null);
  };

  const retirerPromo = async (p: ProduitPromo) => {
    if (!confirm(`Retirer la promotion sur « ${p.nom} » ?`)) return;
    await patchPromo(p.id, {
      prixPromo: null,
      promoDebut: null,
      promoFin: null,
    });
  };

  const toggleVedette = async (p: ProduitPromo) => {
    await patchPromo(p.id, { featured: !p.featured });
  };

  const inputClass = 'admin-marketing-input';

  return (
    <>
      <div className="admin-marketing-stats">
        <div className="admin-marketing-stat">
          <span className="admin-marketing-stat-value">{stats.total}</span>
          <span className="admin-marketing-stat-label">Produits</span>
        </div>
        <div className="admin-marketing-stat is-pending">
          <span className="admin-marketing-stat-value">{stats.enCours}</span>
          <span className="admin-marketing-stat-label">Promos en cours</span>
        </div>
        <div className="admin-marketing-stat is-approved">
          <span className="admin-marketing-stat-value">{stats.avecPromo}</span>
          <span className="admin-marketing-stat-label">Avec prix promo</span>
        </div>
        <div className="admin-marketing-stat">
          <span className="admin-marketing-stat-value">{stats.vedettes}</span>
          <span className="admin-marketing-stat-label">En vedette</span>
        </div>
      </div>

      <div className="admin-marketing-toolbar">
        <FilterSearchInput
          value={recherche}
          onChange={setRecherche}
          placeholder="Rechercher un produit…"
        />
        <div className="admin-marketing-filters">
          {FILTRES.map(({ id, label }) => (
            <button
              key={id || 'all'}
              type="button"
              onClick={() => setFiltre(id)}
              className={`admin-marketing-filter ${filtre === id ? 'is-active' : ''}`}
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
        ) : produitsFiltres.length === 0 ? (
          <p className="admin-marketing-empty-text">Aucun produit trouvé.</p>
        ) : (
          <>
            <div className="admin-marketing-table-wrap">
              <table className="admin-marketing-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Prix normal</th>
                    <th>Prix promo</th>
                    <th>Réduction</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Vedette</th>
                    <th>Statut</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {produitsFiltres.map((p) => {
                    const busy = actionId === p.id;
                    const remise = remisePercent(p);
                    const enCours = isPromoEnCours(p);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="admin-promo-product">
                            <div className="admin-promo-thumb">
                              {p.images[0] ? (
                                <Image
                                  src={p.images[0]}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <Tag className="h-4 w-4 text-zinc-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-zinc-900">{p.nom}</p>
                              <p className="truncate text-xs text-zinc-400">/{p.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-zinc-600">{formatGn(p.prix)}</td>
                        <td>
                          {p.prixPromo != null ? (
                            <span className="font-semibold text-[#e91e8c]">{formatGn(p.prixPromo)}</span>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                        <td>
                          {remise != null ? (
                            <span className="admin-promo-remise">-{remise}%</span>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                        <td className="text-xs text-zinc-500 whitespace-nowrap">
                          {formatDate(p.promoDebut)}
                        </td>
                        <td className="text-xs text-zinc-500 whitespace-nowrap">
                          {formatDate(p.promoFin)}
                        </td>
                        <td>
                          {p.featured ? (
                            <span className="admin-promo-featured">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              Oui
                            </span>
                          ) : (
                            <span className="text-zinc-300 text-xs">Non</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`admin-marketing-badge ${
                              enCours
                                ? 'is-live'
                                : !p.actif
                                  ? 'is-inactive'
                                  : hasPromoConfigured(p)
                                    ? 'is-active'
                                    : 'is-inactive'
                            }`}
                          >
                            {enCours
                              ? 'En cours'
                              : !p.actif
                                ? 'Inactif'
                                : hasPromoConfigured(p)
                                  ? 'Programmé'
                                  : 'Sans promo'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-marketing-actions">
                            <button
                              type="button"
                              title="Modifier la promotion"
                              onClick={() => setEditProduit({ ...p })}
                              className="admin-marketing-action"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              title={p.featured ? 'Retirer vedette' : 'Mettre en vedette'}
                              disabled={busy}
                              onClick={() => toggleVedette(p)}
                              className={`admin-marketing-action ${p.featured ? 'is-approve' : ''}`}
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                              )}
                            </button>
                            {hasPromoConfigured(p) && (
                              <button
                                type="button"
                                title="Retirer la promotion"
                                disabled={busy}
                                onClick={() => retirerPromo(p)}
                                className="admin-marketing-action is-delete"
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                              </button>
                            )}
                            <Link
                              href={`/produits/${p.slug}`}
                              target="_blank"
                              title="Voir sur la boutique"
                              className="admin-marketing-action"
                            >
                              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                            </Link>
                            <Link
                              href={`/admin/produits?edit=${p.id}`}
                              title="Fiche produit admin"
                              className="admin-marketing-action"
                            >
                              <Tag className="h-4 w-4" strokeWidth={1.75} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="admin-marketing-footer">
              {produitsFiltres.length} produit{produitsFiltres.length > 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>

      {editProduit && (
        <div className="admin-marketing-modal-backdrop" onClick={() => setEditProduit(null)}>
          <div className="admin-marketing-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-marketing-modal-head">
              <h2>Promotion — {editProduit.nom}</h2>
              <button type="button" onClick={() => setEditProduit(null)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="admin-marketing-modal-body">
              <p className="text-sm text-zinc-500">
                Prix normal : <strong className="text-zinc-800">{formatGn(editProduit.prix)}</strong>
              </p>
              <label className="admin-marketing-field">
                <span>Prix promo (GN)</span>
                <input
                  type="number"
                  value={editProduit.prixPromo ?? ''}
                  onChange={(e) =>
                    setEditProduit({
                      ...editProduit,
                      prixPromo: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className={inputClass}
                  placeholder="Ex. 45000"
                />
              </label>
              <div className="admin-marketing-modal-grid">
                <label className="admin-marketing-field">
                  <span>Date de début</span>
                  <input
                    type="date"
                    value={toDateInput(editProduit.promoDebut)}
                    onChange={(e) =>
                      setEditProduit({
                        ...editProduit,
                        promoDebut: e.target.value
                          ? `${e.target.value}T00:00:00.000Z`
                          : null,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="admin-marketing-field">
                  <span>Date de fin</span>
                  <input
                    type="date"
                    value={toDateInput(editProduit.promoFin)}
                    onChange={(e) =>
                      setEditProduit({
                        ...editProduit,
                        promoFin: e.target.value
                          ? `${e.target.value}T23:59:59.000Z`
                          : null,
                      })
                    }
                    className={inputClass}
                  />
                </label>
              </div>
              {editProduit.prixPromo != null && editProduit.prixPromo < editProduit.prix && (
                <p className="text-sm font-semibold text-[#e91e8c]">
                  Réduction : -{remisePercent(editProduit)}%
                </p>
              )}
              <label className="admin-marketing-product-check">
                <input
                  type="checkbox"
                  checked={editProduit.featured}
                  onChange={(e) =>
                    setEditProduit({ ...editProduit, featured: e.target.checked })
                  }
                />
                <span>Mettre en vedette sur la page Promotions</span>
              </label>
            </div>
            <div className="admin-marketing-modal-actions">
              <button
                type="button"
                onClick={sauverEdit}
                disabled={actionId === editProduit.id}
                className="admin-marketing-modal-btn is-primary"
              >
                {actionId === editProduit.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
