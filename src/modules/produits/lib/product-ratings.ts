export type NotesProduitMap = Record<string, { moyenne: number; total: number }>;

export function notesPourProduit(
  map: NotesProduitMap,
  productId: string,
): { rating?: number; reviews?: number } {
  const stats = map[productId];
  if (!stats || stats.total === 0) return {};
  return { rating: stats.moyenne, reviews: stats.total };
}

export function mapVersNotesProduit(
  map: Map<string, { moyenne: number; total: number }>,
): NotesProduitMap {
  return Object.fromEntries(map.entries());
}

export async function chargerNotesProduits(
  productIds: string[],
  fetcher: (ids: string[]) => Promise<Map<string, { moyenne: number; total: number }>>,
): Promise<NotesProduitMap> {
  const unique = [...new Set(productIds)];
  if (unique.length === 0) return {};
  return mapVersNotesProduit(await fetcher(unique));
}
