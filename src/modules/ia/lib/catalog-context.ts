import { unstable_cache } from 'next/cache';
import type { Product } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import { estPromoActive, prixEffectif } from '@/modules/produits/lib/promo';

export type ProduitCatalogueIa = {
  id: string;
  nom: string;
  slug: string;
  marque: string | null;
  categorie: string;
  prix: number;
  prixCatalogue: number;
  enPromo: boolean;
  stockTotal: number;
  disponible: boolean;
  variantesResume: string;
  vedette: boolean;
  description: string;
  image: string | null;
};

type ProduitAvecVariantes = {
  id: string;
  nom: string;
  slug: string;
  marque: string | null;
  prix: { toString(): string };
  prixPromo: { toString(): string } | null;
  promoDebut: Date | null;
  promoFin: Date | null;
  featured: boolean;
  description: string | null;
  images: string[];
  categorie: { nom: string };
  variantes: {
    taille: string | null;
    couleur: string | null;
    capacite: string | null;
    stock: number;
  }[];
};

function resumerVariantes(variantes: ProduitAvecVariantes['variantes']): string {
  if (variantes.length === 0) return 'aucune variante';
  return variantes
    .map((v) => {
      const label = [v.capacite, v.taille, v.couleur].filter(Boolean).join(' · ') || 'standard';
      return `${label} (${v.stock} en stock)`;
    })
    .join(' | ');
}

function versProduitCatalogueIa(p: ProduitAvecVariantes): ProduitCatalogueIa {
  const stockTotal = p.variantes.reduce((n, v) => n + v.stock, 0);
  const prixCatalogue = Number(p.prix);
  const promoFields = p as unknown as Pick<Product, 'prixPromo' | 'promoDebut' | 'promoFin' | 'prix'>;
  const enPromo = estPromoActive(promoFields);

  return {
    id: p.id,
    nom: p.nom,
    slug: p.slug,
    marque: p.marque,
    categorie: p.categorie.nom,
    prix: prixEffectif(promoFields),
    prixCatalogue,
    enPromo,
    stockTotal,
    disponible: stockTotal > 0,
    variantesResume: resumerVariantes(p.variantes),
    vedette: p.featured,
    description: (p.description ?? '').slice(0, 200),
    image: p.images[0] ?? null,
  };
}

async function chargerCatalogueIa(limit: number): Promise<ProduitCatalogueIa[]> {
  const produits = await prisma.product.findMany({
    where: { actif: true },
    include: {
      categorie: true,
      variantes: {
        select: { taille: true, couleur: true, capacite: true, stock: true },
      },
    },
    take: limit,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  });

  return produits.map(versProduitCatalogueIa);
}

export async function obtenirCatalogueIa(limit = 120): Promise<ProduitCatalogueIa[]> {
  return unstable_cache(
    () => chargerCatalogueIa(limit),
    ['ia-catalogue-v2', String(limit)],
    { revalidate: 120, tags: ['products'] },
  )();
}

export function formaterCataloguePourPrompt(catalogue: ProduitCatalogueIa[]): string {
  const dispo = catalogue.filter((p) => p.disponible).length;
  const header = `(${catalogue.length} produits actifs, ${dispo} disponibles en stock)\n`;

  const lignes = catalogue.map((p) => {
    const prix =
      p.enPromo && p.prix < p.prixCatalogue
        ? `${p.prix.toLocaleString('fr-FR')} GN (promo, était ${p.prixCatalogue.toLocaleString('fr-FR')} GN)`
        : `${p.prix.toLocaleString('fr-FR')} GN`;

    const stock = p.disponible
      ? `EN STOCK (${p.stockTotal} unités)`
      : 'RUPTURE DE STOCK';

    const extras = [
      p.marque ? `marque:${p.marque}` : null,
      p.vedette ? 'vedette' : null,
      `variantes: ${p.variantesResume}`,
    ]
      .filter(Boolean)
      .join(' | ');

    return [
      `- slug:${p.slug}`,
      `nom:${p.nom}`,
      `cat:${p.categorie}`,
      `prix:${prix}`,
      stock,
      extras,
      p.description ? `desc:${p.description}` : null,
    ]
      .filter(Boolean)
      .join(' | ');
  });

  return header + lignes.join('\n');
}

export async function produitsParIds(ids: string[]): Promise<ProduitCatalogueIa[]> {
  if (ids.length === 0) return [];
  const produits = await prisma.product.findMany({
    where: { id: { in: ids }, actif: true },
    include: {
      categorie: true,
      variantes: {
        select: { taille: true, couleur: true, capacite: true, stock: true },
      },
    },
  });

  const map = new Map(produits.map((p) => [p.id, p]));
  return ids
    .map((id) => map.get(id))
    .filter(Boolean)
    .map((p) => versProduitCatalogueIa(p!));
}
