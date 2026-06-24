'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Boxes,
  ExternalLink,
  FolderTree,
  Loader2,
  Package,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react';
import {
  AdminProductEditor,
  newProduitForm,
  produitToForm,
  type ProduitForm,
} from '@/modules/admin/components/catalogue/AdminProductEditor';
import { STOCK_FAIBLE_SEUIL } from '@/modules/admin/lib/stock-threshold';
import { useAdminStats } from '@/modules/admin/components/layout/AdminStatsProvider';
import type {
  FiltreProduitAdmin,
  ProduitAdminListItem,
  ProduitAdminResume,
} from '@/modules/admin/services/admin-catalog.service';

type Categorie = { id: string; nom: string; actif?: boolean; parentNom?: string | null };

const FILTRES: { id: FiltreProduitAdmin; label: string }[] = [
  { id: '', label: 'Tous' },
  { id: 'actif', label: 'Actifs' },
  { id: 'inactif', label: 'Inactifs' },
  { id: 'stock-faible', label: 'Stock faible' },
  { id: 'rupture', label: 'Rupture' },
  { id: 'vedette', label: 'Vedettes' },
];

function formatGn(value: number) {
  return `${value.toLocaleString('fr-FR')} GN`;
}

export function AdminProduitsPage() {
  const searchParams = useSearchParams();
  const { refresh: refreshStats } = useAdminStats();
  const [produits, setProduits] = useState<ProduitAdminListItem[]>([]);
  const [resume, setResume] = useState<ProduitAdminResume | null>(null);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<FiltreProduitAdmin>('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorForm, setEditorForm] = useState<ProduitForm>(newProduitForm(''));
  const [editingId, setEditingId] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (recherche.trim()) params.set('q', recherche.trim());
      if (filtre) params.set('filtre', filtre);
      const qs = params.toString();
      const res = await fetch(`/api/admin/produits${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProduits(data.produits ?? []);
        setResume(data.resume ?? null);
        setCategories(data.categories ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [recherche, filtre]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), recherche ? 220 : 0);
    return () => clearTimeout(timer);
  }, [load, recherche]);

  const openCreate = () => {
    setEditingId(undefined);
    setEditorTitle('Nouveau produit');
    const defaultCat = categories.find((c) => c.actif !== false)?.id ?? categories[0]?.id ?? '';
    setEditorForm(newProduitForm(defaultCat));
    setEditorOpen(true);
  };

  const openEdit = useCallback((p: ProduitAdminListItem) => {
    setEditingId(p.id);
    setEditorTitle(`Modifier — ${p.nom}`);
    setEditorForm(
      produitToForm(
        {
          nom: p.nom,
          marque: p.marque,
          description: p.description,
          prix: p.prix,
          images: p.images,
          categorie: p.categorie,
          variantes: p.variantes,
        },
        p.categorie.id,
      ),
    );
    setEditorOpen(true);
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || loading || editorOpen) return;
    const produit = produits.find((p) => p.id === editId);
    if (produit) openEdit(produit);
  }, [searchParams, produits, loading, editorOpen, openEdit]);

  const afterMutation = async () => {
    await load();
    await refreshStats();
  };

  const toggleActif = async (id: string) => {
    setActionId(id);
    try {
      await fetch(`/api/admin/produits/${id}`, { method: 'POST' });
      await afterMutation();
    } finally {
      setActionId(null);
    }
  };

  const toggleVedette = async (p: ProduitAdminListItem) => {
    setActionId(p.id);
    try {
      await fetch(`/api/admin/produits/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !p.featured }),
      });
      await afterMutation();
    } finally {
      setActionId(null);
    }
  };

  const supprimer = async (id: string, nom: string) => {
    if (!confirm(`Supprimer « ${nom} » ?`)) return;
    setActionId(id);
    try {
      await fetch(`/api/admin/produits/${id}`, { method: 'DELETE' });
      await afterMutation();
    } finally {
      setActionId(null);
    }
  };

  const stats = useMemo(
    () =>
      resume ?? {
        total: 0,
        actifs: 0,
        inactifs: 0,
        stockFaible: 0,
        enRupture: 0,
        vedettes: 0,
      },
    [resume],
  );

  return (
    <div className="admin-marketing-page">
      <header className="admin-marketing-header">
        <div>
          <h1 className="admin-marketing-title">
            <Package className="h-7 w-7 text-[#e91e8c]" strokeWidth={1.75} />
            Gestion des produits
          </h1>
          <p className="admin-marketing-subtitle">
            Images multiples, variantes, SKU, codes-barres — alerte stock ≤ {STOCK_FAIBLE_SEUIL}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/categories" className="admin-marketing-refresh">
            <FolderTree className="h-4 w-4" />
            Catégories
          </Link>
          <button type="button" onClick={load} disabled={loading} className="admin-marketing-refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button type="button" onClick={openCreate} className="admin-marketing-create-btn">
            <Plus className="h-4 w-4" />
            Nouveau produit
          </button>
        </div>
      </header>

      <div className="admin-marketing-stats">
        <div className="admin-marketing-stat">
          <span className="admin-marketing-stat-value">{stats.total}</span>
          <span className="admin-marketing-stat-label">Produits</span>
        </div>
        <div className="admin-marketing-stat is-approved">
          <span className="admin-marketing-stat-value">{stats.actifs}</span>
          <span className="admin-marketing-stat-label">Actifs</span>
        </div>
        <div className="admin-marketing-stat is-pending">
          <span className="admin-marketing-stat-value">{stats.stockFaible}</span>
          <span className="admin-marketing-stat-label">Stock faible</span>
        </div>
        <div className="admin-marketing-stat is-refused">
          <span className="admin-marketing-stat-value">{stats.enRupture}</span>
          <span className="admin-marketing-stat-label">En rupture</span>
        </div>
      </div>

      <div className="admin-marketing-toolbar">
        <div className="admin-marketing-search-wrap">
          <Search className="admin-marketing-search-icon" strokeWidth={1.75} />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher produit, marque, SKU, catégorie…"
            className="admin-marketing-search"
          />
        </div>
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
        {loading && produits.length === 0 ? (
          <div className="admin-marketing-empty">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : produits.length === 0 ? (
          <p className="admin-marketing-empty-text">Aucun produit trouvé.</p>
        ) : (
          <>
            <div className="admin-marketing-table-wrap">
              <table className="admin-marketing-table admin-produits-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Image</th>
                    <th>Catégorie</th>
                    <th>Variantes</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th>Statut</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.map((p) => {
                    const busy = actionId === p.id;
                    return (
                      <tr
                        key={p.id}
                        className={p.alerteStock ? 'admin-stock-row-alert' : ''}
                      >
                        <td>
                          <div className="admin-promo-product">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-zinc-900">{p.nom}</p>
                              <p className="truncate text-xs text-zinc-400">
                                {p.marque || p.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="admin-promo-thumb">
                            {p.images[0] ? (
                              <Image
                                src={p.images[0]}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-zinc-300" />
                            )}
                          </div>
                        </td>
                        <td className="text-xs text-zinc-500">{p.categorie.nom}</td>
                        <td className="text-center font-medium text-zinc-700">
                          {p.variantesCount}
                        </td>
                        <td>
                          <span className="font-semibold text-zinc-900">{formatGn(p.prix)}</span>
                          {p.prixPromo != null && (
                            <span className="mt-0.5 block text-xs text-[#e91e8c]">
                              Promo {formatGn(p.prixPromo)}
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`font-semibold ${
                              p.enRupture
                                ? 'text-red-600'
                                : p.alerteStock
                                  ? 'text-amber-700'
                                  : 'text-zinc-800'
                            }`}
                          >
                            {p.stockTotal}
                          </span>
                          {p.alerteStock && (
                            <span className="admin-stock-pill mt-0.5 block w-fit">
                              {p.variantesStockFaible} var. ≤ {STOCK_FAIBLE_SEUIL}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`admin-marketing-badge ${
                                p.actif ? 'is-active' : 'is-inactive'
                              }`}
                            >
                              {p.actif ? 'Actif' : 'Inactif'}
                            </span>
                            {p.featured && (
                              <span className="admin-marketing-badge is-live">Vedette</span>
                            )}
                            {p.enRupture && (
                              <span className="admin-marketing-badge is-inactive">Rupture</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="admin-marketing-actions">
                            <button
                              type="button"
                              title="Modifier"
                              onClick={() => openEdit(p)}
                              className="admin-marketing-action"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                            <Link
                              href={`/produits/${p.slug}`}
                              target="_blank"
                              title="Voir sur la boutique"
                              className="admin-marketing-action"
                            >
                              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                            </Link>
                            <button
                              type="button"
                              title={p.actif ? 'Désactiver' : 'Activer'}
                              disabled={busy}
                              onClick={() => toggleActif(p.id)}
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
                              title={p.featured ? 'Retirer vedette' : 'Mettre en vedette'}
                              disabled={busy}
                              onClick={() => toggleVedette(p)}
                              className={`admin-marketing-action ${p.featured ? 'is-approve' : ''}`}
                            >
                              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                            <Link
                              href={`/admin/promotions?edit=${p.id}`}
                              title="Promotion"
                              className="admin-marketing-action"
                            >
                              <Tag className="h-4 w-4" strokeWidth={1.75} />
                            </Link>
                            {p.alerteStock && (
                              <Link
                                href="/admin/stocks?faible=1"
                                title="Gérer le stock"
                                className="admin-marketing-action"
                              >
                                <Boxes className="h-4 w-4" strokeWidth={1.75} />
                              </Link>
                            )}
                            <button
                              type="button"
                              title="Supprimer"
                              disabled={busy}
                              onClick={() => supprimer(p.id, p.nom)}
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
              {produits.length} produit{produits.length > 1 ? 's' : ''} affiché
              {produits.length > 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>

      <AdminProductEditor
        key={editingId ?? 'new'}
        open={editorOpen}
        title={editorTitle}
        categories={categories}
        initial={editorForm}
        productId={editingId}
        onClose={() => setEditorOpen(false)}
        onSaved={afterMutation}
      />
    </div>
  );
}
