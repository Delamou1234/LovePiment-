'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FolderTree,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Categorie = {
  id: string;
  nom: string;
  slug: string;
  image: string | null;
  actif: boolean;
  parentId: string | null;
  parent: { id: string; nom: string; slug: string } | null;
  produitsCount: number;
  childrenCount: number;
};

const emptyForm = () => ({
  nom: '',
  slug: '',
  image: '',
  parentId: '',
  actif: true,
});

function genererSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Categorie | null>(null);
  const [reassignToId, setReassignToId] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/categories', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setCategories([]);
        setLoadError(
          data.message ??
            (res.status === 401
              ? 'Session expirée — reconnectez-vous via /connexion?redirect=/admin/categories'
              : 'Impossible de charger les catégories'),
        );
        return;
      }
      setCategories(data.categories ?? []);
    } catch {
      setCategories([]);
      setLoadError('Erreur réseau lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useRunAfterMount(() => void load(), [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError('');
    setFormOpen(true);
  };

  const openEdit = (c: Categorie) => {
    setEditingId(c.id);
    setForm({
      nom: c.nom,
      slug: c.slug,
      image: c.image ?? '',
      parentId: c.parentId ?? '',
      actif: c.actif,
    });
    setError('');
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.nom.trim()) {
      setError('Le nom est requis');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      nom: form.nom.trim(),
      slug: form.slug.trim() || undefined,
      image: form.image.trim() || null,
      parentId: form.parentId || null,
      actif: form.actif,
    };

    try {
      const res = await fetch('/api/admin/categories', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur');
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (c: Categorie) => {
    if (c.childrenCount > 0) {
      alert(
        `Impossible : « ${c.nom} » contient ${c.childrenCount} sous-catégorie(s). Supprimez-les d'abord.`,
      );
      return;
    }
    if (c.produitsCount > 0) {
      const autres = categories.filter((cat) => cat.id !== c.id);
      if (autres.length === 0) {
        alert('Créez une autre catégorie avant de supprimer celle-ci.');
        return;
      }
      setDeleteTarget(c);
      setReassignToId(autres[0]?.id ?? '');
      setDeleteError('');
      return;
    }
    if (!confirm(`Supprimer la catégorie « ${c.nom} » ?`)) return;
    await executerSuppression(c.id);
  };

  const executerSuppression = async (id: string, reassignTo?: string) => {
    setDeleting(true);
    setDeleteError('');
    const params = new URLSearchParams({ id });
    if (reassignTo) params.set('reassignTo', reassignTo);

    const res = await fetch(`/api/admin/categories?${params.toString()}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    setDeleting(false);

    if (!res.ok) {
      setDeleteError(data.message ?? 'Suppression impossible');
      return false;
    }

    setDeleteTarget(null);
    setReassignToId('');
    await load();
    return true;
  };

  const confirmerSuppressionAvecReassign = async () => {
    if (!deleteTarget || !reassignToId) {
      setDeleteError('Choisissez une catégorie de destination');
      return;
    }
    await executerSuppression(deleteTarget.id, reassignToId);
  };

  const toggleActif = async (c: Categorie) => {
    const res = await fetch('/api/admin/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: c.id, actif: !c.actif }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message ?? 'Mise à jour impossible');
      return;
    }
    await load();
  };

  const parentOptions = categories.filter((c) => !c.parentId && c.id !== editingId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <FolderTree className="h-6 w-6" />
            Catégories produits
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Organisez le catalogue : catégories principales et sous-catégories.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button size="sm" onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle catégorie
          </Button>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Les catégories apparaissent dans le{' '}
        <Link href="/produits" className="text-[#9B1B2E] font-medium hover:underline">
          catalogue
        </Link>{' '}
        et lors de la{' '}
        <Link href="/admin/produits" className="text-[#9B1B2E] font-medium hover:underline">
          création de produits
        </Link>
        .
      </p>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <p className="text-xs text-amber-800/80 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
        La corbeille est grisée si la catégorie a des <strong>sous-catégories</strong>. Si elle a des{' '}
        <strong>produits</strong>, un clic ouvre le choix de la catégorie où les déplacer avant suppression.
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-12 text-center">
          <p className="text-sm text-zinc-500 mb-4">Aucune catégorie pour le moment.</p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une catégorie
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Parente</th>
                <th className="px-4 py-3">Produits</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {c.image ? (
                        <div className="relative h-9 w-9 rounded-lg overflow-hidden ring-1 ring-zinc-200 shrink-0">
                          <Image src={c.image} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-[#FFF8F6] ring-1 ring-[#F2D4DC] shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-zinc-900">
                          {c.parentId ? `↳ ${c.nom}` : c.nom}
                        </p>
                        {c.childrenCount > 0 && (
                          <p className="text-xs text-zinc-400">
                            {c.childrenCount} sous-catégorie{c.childrenCount > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{c.slug}</td>
                  <td className="px-4 py-3 text-zinc-500">{c.parent?.nom ?? '—'}</td>
                  <td className="px-4 py-3">{c.produitsCount}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActif(c)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium transition hover:opacity-80 ${
                        c.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                      }`}
                      title={c.actif ? 'Désactiver' : 'Activer'}
                    >
                      {c.actif ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="rounded-lg p-2 hover:bg-zinc-100"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4 text-zinc-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => supprimer(c)}
                        className={`rounded-lg p-2 hover:bg-red-50 ${
                          c.childrenCount > 0
                            ? 'cursor-not-allowed text-zinc-300'
                            : 'text-red-500'
                        }`}
                        title={
                          c.childrenCount > 0
                            ? `${c.childrenCount} sous-catégorie(s) — supprimez-les d'abord`
                            : c.produitsCount > 0
                              ? `${c.produitsCount} produit(s) — cliquer pour déplacer puis supprimer`
                              : 'Supprimer'
                        }
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

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <h2 className="font-bold text-zinc-900">Supprimer « {deleteTarget.nom} »</h2>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg p-1 hover:bg-zinc-100"
              >
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-zinc-600">
                Cette catégorie contient{' '}
                <strong>{deleteTarget.produitsCount} produit{deleteTarget.produitsCount > 1 ? 's' : ''}</strong>.
                Choisissez où les déplacer avant suppression.
              </p>
              <div>
                <label className="text-xs font-semibold text-zinc-600">Déplacer les produits vers</label>
                <select
                  value={reassignToId}
                  onChange={(e) => setReassignToId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                >
                  {categories
                    .filter((cat) => cat.id !== deleteTarget.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parentId ? `↳ ${cat.nom}` : cat.nom}
                      </option>
                    ))}
                </select>
              </div>
              {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Annuler
              </Button>
              <Button
                onClick={confirmerSuppressionAvecReassign}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Déplacer et supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <h2 className="font-bold text-zinc-900">
                {editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>
              <button type="button" onClick={() => setFormOpen(false)} className="p-1 hover:bg-zinc-100 rounded-lg">
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-600">Nom *</label>
                <input
                  value={form.nom}
                  onChange={(e) => {
                    const nom = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      nom,
                      slug: editingId ? prev.slug : genererSlug(nom),
                    }));
                  }}
                  placeholder="Ex: Parfums"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-600">Slug (URL)</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="Auto-généré si vide — ex: parfums"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-600">Image (URL)</label>
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://…"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-600">Catégorie parente</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                >
                  <option value="">Aucune (catégorie principale)</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                  className="rounded border-zinc-300"
                />
                Catégorie active (visible boutique)
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Annuler
              </Button>
              <Button onClick={save} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
