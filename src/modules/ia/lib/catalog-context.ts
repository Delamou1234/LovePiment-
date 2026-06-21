import { prisma } from '@/shared/lib/prisma';

export type ProduitCatalogueIa = {
  id: string;
  nom: string;
  slug: string;
  categorie: string;
  prix: number;
  description: string;
  image: string | null;
};

export async function obtenirCatalogueIa(limit = 100): Promise<ProduitCatalogueIa[]> {
  const produits = await prisma.product.findMany({
    where: { actif: true },
    include: { categorie: true },
    take: limit,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  });

  return produits.map((p) => ({
    id: p.id,
    nom: p.nom,
    slug: p.slug,
    categorie: p.categorie.nom,
    prix: Number(p.prixPromo ?? p.prix),
    description: (p.description ?? '').slice(0, 160),
    image: p.images[0] ?? null,
  }));
}

export function formaterCataloguePourPrompt(catalogue: ProduitCatalogueIa[]): string {
  return catalogue
    .map(
      (p) =>
        `- id:${p.id} | slug:${p.slug} | ${p.nom} | ${p.categorie} | ${p.prix} GN | ${p.description}`,
    )
    .join('\n');
}

export async function produitsParIds(ids: string[]): Promise<ProduitCatalogueIa[]> {
  if (ids.length === 0) return [];
  const produits = await prisma.product.findMany({
    where: { id: { in: ids }, actif: true },
    include: { categorie: true },
  });

  const map = new Map(produits.map((p) => [p.id, p]));
  return ids
    .map((id) => map.get(id))
    .filter(Boolean)
    .map((p) => ({
      id: p!.id,
      nom: p!.nom,
      slug: p!.slug,
      categorie: p!.categorie.nom,
      prix: Number(p!.prixPromo ?? p!.prix),
      description: (p!.description ?? '').slice(0, 160),
      image: p!.images[0] ?? null,
    }));
}
