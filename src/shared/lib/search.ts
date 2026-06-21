/** Normalise une chaîne pour la recherche (sans accents, minuscules) */
export function normaliserRecherche(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
