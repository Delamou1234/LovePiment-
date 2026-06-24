'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2, Plus, Trash2, X, ImageIcon } from 'lucide-react';

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
    <div className="admin-product-editor-backdrop">
      <div className="admin-product-editor" role="dialog" aria-modal aria-labelledby="product-editor-title">
        <div className="admin-product-editor-head">
          <h2 id="product-editor-title" className="admin-product-editor-title">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="admin-product-editor-close" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="admin-product-editor-body">
          <div className="admin-product-editor-fields">
            <label className="admin-product-editor-field span-full">
              <span>Nom du produit *</span>
              <input
                className="admin-product-editor-input"
                placeholder="Ex. Gel Stimulant Intense"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </label>
            <label className="admin-product-editor-field">
              <span>Marque</span>
              <input
                className="admin-product-editor-input"
                placeholder="Love Pimenté"
                value={form.marque}
                onChange={(e) => setForm({ ...form, marque: e.target.value })}
              />
            </label>
            <label className="admin-product-editor-field field-narrow">
              <span>Prix (GNF) *</span>
              <input
                className="admin-product-editor-input"
                placeholder="48000"
                type="number"
                value={form.prix}
                onChange={(e) => setForm({ ...form, prix: e.target.value })}
              />
            </label>
            <label className="admin-product-editor-field field-medium">
              <span>Catégorie *</span>
              <select
                className="admin-product-editor-input"
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
            </label>
            <label className="admin-product-editor-field span-full">
              <span>Description</span>
              <textarea
                className="admin-product-editor-input admin-product-editor-textarea"
                placeholder="Description du produit"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
          </div>

          <div className="admin-product-editor-section">
            <h3 className="admin-product-editor-section-title">
              <ImageIcon className="h-4 w-4" /> Images ({form.images.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {form.images.map((url, idx) => (
                <div key={`${url}-${idx}`} className="admin-product-editor-thumb">
                  <Image src={url} alt="" fill sizes="64px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
                    }
                    className="admin-product-editor-thumb-remove"
                    aria-label="Supprimer l'image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="admin-product-editor-image-add">
              <input
                className="admin-product-editor-input"
                placeholder="URL image (https://...)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
              <button type="button" onClick={addImage} className="admin-product-editor-icon-btn">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="admin-product-editor-section">
            <div className="flex items-center justify-between gap-2">
              <h3 className="admin-product-editor-section-title">Variantes &amp; stock</h3>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, variantes: [...f.variantes, emptyVariante()] }))}
                className="admin-product-editor-add-btn"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </button>
            </div>
            <div className="admin-product-editor-variants-wrap">
              <table className="admin-product-editor-variants">
                <thead>
                  <tr>
                    <th>Capacité</th>
                    <th>Taille</th>
                    <th>Couleur</th>
                    <th>Stock</th>
                    <th>SKU</th>
                    <th>Code-barres</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {form.variantes.map((v, idx) => (
                    <tr key={v.id ?? idx}>
                      <td>
                        <input
                          className="admin-product-editor-input admin-product-editor-input-compact field-capacite"
                          placeholder="100ml"
                          value={v.capacite}
                          onChange={(e) => updateVariante(idx, { capacite: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="admin-product-editor-input admin-product-editor-input-compact field-taille"
                          value={v.taille}
                          onChange={(e) => updateVariante(idx, { taille: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="admin-product-editor-input admin-product-editor-input-compact field-couleur"
                          value={v.couleur}
                          onChange={(e) => updateVariante(idx, { couleur: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="admin-product-editor-input admin-product-editor-input-compact field-stock"
                          type="number"
                          min={0}
                          value={v.stock}
                          onChange={(e) => updateVariante(idx, { stock: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="admin-product-editor-input admin-product-editor-input-compact field-sku"
                          value={v.sku}
                          onChange={(e) => updateVariante(idx, { sku: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="admin-product-editor-input admin-product-editor-input-compact field-barcode"
                          value={v.codeBarre}
                          onChange={(e) => updateVariante(idx, { codeBarre: e.target.value })}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              variantes: f.variantes.filter((_, i) => i !== idx),
                            }))
                          }
                          className="admin-product-editor-icon-btn is-danger"
                          aria-label="Supprimer la variante"
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

          {error && <p className="admin-product-editor-error">{error}</p>}
        </div>

        <div className="admin-product-editor-foot">
          <button type="button" onClick={onClose} disabled={saving} className="admin-product-editor-btn">
            Annuler
          </button>
          <button type="button" onClick={save} disabled={saving} className="admin-product-editor-btn is-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </button>
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
