export type CatalogSearchParams = {
  categorie?: string;
  taille?: string;
  couleur?: string;
  marque?: string;
  search?: string;
  tri?: string;
  prixMin?: string;
  prixMax?: string;
  promo?: string;
  enStock?: string;
};

export function buildCatalogUrl(
  current: CatalogSearchParams,
  updates: Partial<Record<keyof CatalogSearchParams, string | null>>,
): string {
  const params = new URLSearchParams();

  const merged: CatalogSearchParams = { ...current };
  for (const [key, val] of Object.entries(updates) as [keyof CatalogSearchParams, string | null][]) {
    if (val === null || val === '') {
      delete merged[key];
    } else {
      merged[key] = val;
    }
  }

  for (const [key, val] of Object.entries(merged)) {
    if (val) params.set(key, val);
  }

  const qs = params.toString();
  return qs ? `/produits?${qs}` : '/produits';
}

export const CATALOG_TRI_OPTIONS = [
  { value: 'nouveautes', label: 'Nouveautés' },
  { value: 'popularite', label: 'Popularité' },
  { value: 'prix_asc', label: 'Prix ↗' },
  { value: 'prix_desc', label: 'Prix ↘' },
  { value: 'nom_asc', label: 'Nom A–Z' },
] as const;

export function catalogTriToRepository(tri: string) {
  const map = {
    prix_asc: { champ: 'prix' as const, ordre: 'asc' as const },
    prix_desc: { champ: 'prix' as const, ordre: 'desc' as const },
    nouveautes: { champ: 'createdAt' as const, ordre: 'desc' as const },
    nom_asc: { champ: 'nom' as const, ordre: 'asc' as const },
    popularite: { champ: 'featured' as const, ordre: 'desc' as const },
  };
  return map[tri as keyof typeof map] ?? map.nouveautes;
}
