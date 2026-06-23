'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Pencil, Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AdminProductEditor,
  newProduitForm,
  produitToForm,
  type ProduitForm,
} from '@/modules/admin/components/catalogue/AdminProductEditor';

type Variante = {
  id: string;
  taille: string | null;
  couleur: string | null;
  capacite: string | null;
  stock: number;
  sku: string | null;
  codeBarre: string | null;
  prix: number | null;
};

type Produit = {
  id: string;
  nom: string;
  slug: string;
  marque: string | null;
  description: string | null;
  prix: number;
  actif: boolean;
  featured: boolean;
  images: string[];
  categorie: { id: string; nom: string };
  variantes: Variante[];
};

type Categorie = { id: string; nom: string; actif?: boolean; parentNom?: string | null };

export default function AdminProduitsPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorForm, setEditorForm] = useState<ProduitForm>(newProduitForm(''));
  const [editingId, setEditingId] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/produits');
      if (res.ok) {
        const data = await res.json();
        setProduits(data.produits ?? []);
        setCategories(data.categories ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(undefined);
    setEditorTitle('Nouveau produit');
    const defaultCat = categories.find((c) => c.actif !== false)?.id ?? categories[0]?.id ?? '';
    setEditorForm(newProduitForm(defaultCat));
    setEditorOpen(true);
  };

  const openEdit = (p: Produit) => {
    setEditingId(p.id);
    setEditorTitle(`Modifier — ${p.nom}`);
    setEditorForm(produitToForm(p, p.categorie.id));
    setEditorOpen(true);
  };

  const toggleActif = async (id: string) => {
    await fetch(`/api/admin/produits/${id}`, { method: 'POST' });
    await load();
  };

  const supprimer = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await fetch(`/api/admin/produits/${id}`, { method: 'DELETE' });
    await load();
  };

  const stockTotal = (p: Produit) => p.variantes.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Gestion des produits</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Images multiples, variantes, SKU et codes-barres
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/categories"
            className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted transition"
          >
            <FolderTree className="h-3.5 w-3.5" />
            Catégories
          </Link>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button size="sm" onClick={openCreate} className="btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Images</th>
                <th className="px-4 py-3">Variantes</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {produits.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">{p.nom}</p>
                    {p.marque && <p className="text-xs text-zinc-400">{p.marque}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.images.slice(0, 3).map((img, i) => (
                        <div key={i} className="relative h-8 w-8 overflow-hidden rounded ring-1 ring-zinc-200">
                          <Image src={img} alt="" fill sizes="32px" className="object-cover" />
                        </div>
                      ))}
                      {p.images.length > 3 && (
                        <span className="text-xs text-zinc-400">+{p.images.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{p.variantes.length}</td>
                  <td className="px-4 py-3">{p.prix.toLocaleString('fr-FR')} GN</td>
                  <td className="px-4 py-3">
                    <span className={stockTotal(p) <= 5 ? 'font-medium text-red-600' : ''}>
                      {stockTotal(p)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {p.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-2 hover:bg-zinc-100"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4 text-zinc-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActif(p.id)}
                        className="rounded-lg p-2 hover:bg-zinc-100"
                        title="Activer/désactiver"
                      >
                        {p.actif ? (
                          <ToggleRight className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-zinc-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => supprimer(p.id)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminProductEditor
        key={editingId ?? 'new'}
        open={editorOpen}
        title={editorTitle}
        categories={categories}
        initial={editorForm}
        productId={editingId}
        onClose={() => setEditorOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
