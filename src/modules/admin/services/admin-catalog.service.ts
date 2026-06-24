import { STOCK_FAIBLE_SEUIL, isStockFaible } from '@/modules/admin/lib/stock-threshold';
import { productService } from '@/modules/produits/services/product.service';

export type FiltreProduitAdmin = '' | 'actif' | 'inactif' | 'stock-faible' | 'rupture' | 'vedette';

export type ProduitAdminResume = {
  total: number;
  actifs: number;
  inactifs: number;
  stockFaible: number;
  enRupture: number;
  vedettes: number;
};

export type ProduitAdminListItem = {
  id: string;
  nom: string;
  slug: string;
  marque: string | null;
  description: string | null;
  prix: number;
  prixPromo: number | null;
  actif: boolean;
  featured: boolean;
  images: string[];
  categorie: { id: string; nom: string };
  variantesCount: number;
  stockTotal: number;
  stockMin: number;
  variantesStockFaible: number;
  enRupture: boolean;
  alerteStock: boolean;
  variantes: {
    id: string;
    taille: string | null;
    couleur: string | null;
    capacite: string | null;
    stock: number;
    sku: string | null;
    codeBarre: string | null;
    prix: number | null;
  }[];
};

function enrichirProduit(
  p: Awaited<ReturnType<typeof productService.listerPourAdmin>>[number],
): ProduitAdminListItem {
  const stocks = p.variantes.map((v) => v.stock);
  const stockTotal = stocks.reduce((s, n) => s + n, 0);
  const stockMin = stocks.length > 0 ? Math.min(...stocks) : 0;
  const variantesStockFaible = p.variantes.filter((v) => isStockFaible(v.stock)).length;
  const enRupture = p.variantes.length > 0 && stockTotal === 0;
  const alerteStock = variantesStockFaible > 0;

  return {
    id: p.id,
    nom: p.nom,
    slug: p.slug,
    marque: p.marque,
    description: p.description,
    prix: Number(p.prix),
    prixPromo: p.prixPromo ? Number(p.prixPromo) : null,
    actif: p.actif,
    featured: p.featured,
    images: p.images,
    categorie: { id: p.categorie.id, nom: p.categorie.nom },
    variantesCount: p.variantes.length,
    stockTotal,
    stockMin,
    variantesStockFaible,
    enRupture,
    alerteStock,
    variantes: p.variantes.map((v) => ({
      id: v.id,
      taille: v.taille,
      couleur: v.couleur,
      capacite: v.capacite,
      stock: v.stock,
      sku: v.sku,
      codeBarre: v.codeBarre,
      prix: v.prix ? Number(v.prix) : null,
    })),
  };
}

export const adminCatalogService = {
  async lister(options?: { q?: string; filtre?: FiltreProduitAdmin }) {
    const q = options?.q?.trim().toLowerCase() ?? '';
    const filtre = options?.filtre ?? '';

    const [raw, categories] = await Promise.all([
      productService.listerPourAdmin(),
      productService.listerCategoriesAdmin(),
    ]);

    let produits = raw.map(enrichirProduit);

    if (q) {
      produits = produits.filter(
        (p) =>
          p.nom.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.marque?.toLowerCase().includes(q) ?? false) ||
          p.categorie.nom.toLowerCase().includes(q) ||
          p.variantes.some((v) => v.sku?.toLowerCase().includes(q)),
      );
    }

    if (filtre === 'actif') produits = produits.filter((p) => p.actif);
    if (filtre === 'inactif') produits = produits.filter((p) => !p.actif);
    if (filtre === 'stock-faible') produits = produits.filter((p) => p.alerteStock);
    if (filtre === 'rupture') produits = produits.filter((p) => p.enRupture);
    if (filtre === 'vedette') produits = produits.filter((p) => p.featured);

    const tous = raw.map(enrichirProduit);
    const resume: ProduitAdminResume = {
      total: tous.length,
      actifs: tous.filter((p) => p.actif).length,
      inactifs: tous.filter((p) => !p.actif).length,
      stockFaible: tous.filter((p) => p.alerteStock).length,
      enRupture: tous.filter((p) => p.enRupture).length,
      vedettes: tous.filter((p) => p.featured).length,
    };

    return {
      produits,
      resume,
      seuilStockFaible: STOCK_FAIBLE_SEUIL,
      categories: categories.map((c) => ({
        id: c.id,
        nom: c.nom,
        slug: c.slug,
        actif: c.actif,
        parentId: c.parentId,
        parentNom: c.parent?.nom ?? null,
      })),
    };
  },
};
