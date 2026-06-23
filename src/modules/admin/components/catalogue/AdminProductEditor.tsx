'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2, Plus, Trash2, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type VarianteForm = {
  id?: string;
  taille: string;
  couleur: string;
  capacite: string;
  stock: string;
  sku: string;
  codeBarre: string;
  prix: string;
};

export type ProduitForm = {
  nom: string;
  marque: string;
  description: string;
  prix: string;
  categorieId: string;
  images: string[];
  variantes: VarianteForm[];
};

type Categorie = { id: string; nom: string; actif?: boolean; parentNom?: string | null };

type Props = {
  open: boolean;
  title: string;
  categories: Categorie[];
  initial: ProduitForm;
  productId?: string;
  onClose: () => void;
  onSaved: () => void;
};

const emptyVariante = (): VarianteForm => ({
  taille: '',
  couleur: '',
  capacite: '100ml',
  stock: '10',
  sku: '',
  codeBarre: '',
  prix: '',
});

export function AdminProductEditor({
  open,
  title,
  categories,
  initial,
  productId,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<ProduitForm>(initial);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const updateVariante = (index: number, patch: Partial<VarianteForm>) => {
    setForm((f) => ({
      ...f,
      variantes: f.variantes.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  };

  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setForm((f) => ({ ...f, images: [...f.images, url] }));
    setNewImageUrl('');
  };

  const save = async () => {
    if (!form.nom || !form.prix || !form.categorieId) {
      setError('Nom, prix et catégorie sont requis.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        nom: form.nom,
        marque: form.marque || undefined,
        description: form.description || undefined,
        prix: Number(form.prix),
        categorieId: form.categorieId,
        images: form.images,
      };

      const variantesPayload = form.variantes.map((v) => ({
        id: v.id,
        taille: v.taille || undefined,
        couleur: v.couleur || undefined,
        capacite: v.capacite || undefined,
        stock: Number(v.stock) || 0,
        sku: v.sku || undefined,
        codeBarre: v.codeBarre || undefined,
        prix: v.prix ? Number(v.prix) : undefined,
      }));

      if (productId) {
        const res = await fetch(`/api/admin/produits/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Échec mise à jour produit');

        const vRes = await fetch(`/api/admin/produits/${productId}/variantes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantes: variantesPayload }),
        });
        if (!vRes.ok) throw new Error('Échec mise à jour variantes');
      } else {
        const res = await fetch('/api/admin/produits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, variantes: variantesPayload }),
        });
        if (!res.ok) throw new Error('Échec création produit');
      }

      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-4 w-full max-w-4xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              className="input-kabishop sm:col-span-2"
              placeholder="Nom du produit *"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />
            <input
              className="input-kabishop"
              placeholder="Marque"
              value={form.marque}
              onChange={(e) => setForm({ ...form, marque: e.target.value })}
            />
            <input
              className="input-kabishop"
              placeholder="Prix (GNF) *"
              type="number"
              value={form.prix}
              onChange={(e) => setForm({ ...form, prix: e.target.value })}
            />
            <select
              className="input-kabishop sm:col-span-2"
              value={form.categorieId}
              onChange={(e) => setForm({ ...form, categorieId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentNom ? `${c.parentNom} › ` : ''}
                  {c.nom}
                  {c.actif === false ? ' (inactive)' : ''}
                </option>
              ))}
            </select>
            <textarea
              className="input-kabishop sm:col-span-2 min-h-[80px]"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Images */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-800">
              <ImageIcon className="h-4 w-4" /> Images ({form.images.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {form.images.map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative h-20 w-20 overflow-hidden rounded-lg ring-1 ring-zinc-200">
                  <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
                    }
                    className="absolute right-0.5 top-0.5 rounded bg-red-500 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input-kabishop flex-1"
                placeholder="URL de l'image (https://...)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={addImage}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Variantes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-800">Variantes & stock</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setForm((f) => ({ ...f, variantes: [...f.variantes, emptyVariante()] }))}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
              </Button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full min-w-[720px] text-xs">
                <thead className="bg-zinc-50 text-left uppercase text-zinc-500">
                  <tr>
                    <th className="px-2 py-2">Capacité</th>
                    <th className="px-2 py-2">Taille</th>
                    <th className="px-2 py-2">Couleur</th>
                    <th className="px-2 py-2">Stock</th>
                    <th className="px-2 py-2">SKU</th>
                    <th className="px-2 py-2">Code-barres</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {form.variantes.map((v, idx) => (
                    <tr key={v.id ?? idx}>
                      <td className="px-2 py-1.5">
                        <input
                          className="input-kabishop py-1 text-xs"
                          placeholder="100ml"
                          value={v.capacite}
                          onChange={(e) => updateVariante(idx, { capacite: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className="input-kabishop py-1 text-xs"
                          value={v.taille}
                          onChange={(e) => updateVariante(idx, { taille: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className="input-kabishop py-1 text-xs"
                          value={v.couleur}
                          onChange={(e) => updateVariante(idx, { couleur: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className="input-kabishop w-16 py-1 text-xs"
                          type="number"
                          min={0}
                          value={v.stock}
                          onChange={(e) => updateVariante(idx, { stock: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className="input-kabishop py-1 text-xs"
                          value={v.sku}
                          onChange={(e) => updateVariante(idx, { sku: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className="input-kabishop py-1 text-xs"
                          value={v.codeBarre}
                          onChange={(e) => updateVariante(idx, { codeBarre: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              variantes: f.variantes.filter((_, i) => i !== idx),
                            }))
                          }
                          className="rounded p-1 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

const VOLUME_PATTERN = /^\d+\s*(ml|l|g|kg|cl)$/i;

function normaliserVarianteForm(v: {
  id: string;
  taille: string | null;
  couleur: string | null;
  capacite?: string | null;
  stock: number;
  sku: string | null;
  codeBarre?: string | null;
  prix: number | null;
}): VarianteForm {
  let taille = v.taille ?? '';
  let capacite = v.capacite ?? '';

  if (!capacite && taille && VOLUME_PATTERN.test(taille.trim())) {
    capacite = taille.trim();
    taille = '';
  }

  return {
    id: v.id,
    taille,
    couleur: v.couleur ?? '',
    capacite,
    stock: String(v.stock),
    sku: v.sku ?? '',
    codeBarre: v.codeBarre ?? '',
    prix: v.prix != null ? String(v.prix) : '',
  };
}

export function produitToForm(
  p: {
    nom: string;
    marque?: string | null;
    description?: string | null;
    prix: number;
    images: string[];
    categorie: { id: string };
    variantes: {
      id: string;
      taille: string | null;
      couleur: string | null;
      capacite?: string | null;
      stock: number;
      sku: string | null;
      codeBarre?: string | null;
      prix: number | null;
    }[];
  },
  defaultCategorieId: string,
): ProduitForm {
  return {
    nom: p.nom,
    marque: p.marque ?? '',
    description: p.description ?? '',
    prix: String(p.prix),
    categorieId: p.categorie.id,
    images: p.images ?? [],
    variantes:
      p.variantes.length > 0
        ? p.variantes.map(normaliserVarianteForm)
        : [emptyVariante()],
  };
}

export function newProduitForm(categorieId: string): ProduitForm {
  return {
    nom: '',
    marque: '',
    description: '',
    prix: '',
    categorieId,
    images: [],
    variantes: [emptyVariante()],
  };
}
