/** Communes Conakry / environs — livraison et checkout. */
export const COMMUNES_CONAKRY_REFERENCE = [
  'Kaloum',
  'Dixinn',
  'Matam',
  'Ratoma',
  'Matoto',
  'Coyah',
  'Kindia',
] as const;

export type CommuneConakry = (typeof COMMUNES_CONAKRY_REFERENCE)[number];

/** Communes au tarif « local » Conakry (vs environs). */
export const COMMUNES_TARIF_LOCAL = new Set<string>([
  'Kaloum',
  'Dixinn',
  'Matam',
  'Ratoma',
  'Matoto',
]);

export const QUARTIERS_PAR_COMMUNE: Record<string, string[]> = {
  Kaloum: ['Almamya', 'Boulbinet', 'Coronthie', 'Tombo', 'Sandervalia', 'Autre'],
  Dixinn: ['Kipé', 'Dixinn Centre', 'Lambanyi', 'Nongo', 'Sonfonia', 'Autre'],
  Matam: ['Matam Centre', 'Koloma', 'Kagbelen', 'Autre'],
  Ratoma: ['Kobaya', 'Koloma', 'Nongo', 'Cosa', 'Autre'],
  Matoto: ['Matoto Centre', 'Gbessia', 'Enco5', 'Yimbaya', 'Autre'],
  Coyah: ['Coyah Centre', 'Kouriah', 'Autre'],
  Kindia: ['Kindia Centre', 'Autre'],
};

export const CRENEAUX_LIVRAISON = [
  { value: 'MATIN', label: 'Matin (9h – 13h)' },
  { value: 'APRES_MIDI', label: 'Après-midi (14h – 19h)' },
  { value: 'FLEXIBLE', label: 'Peu importe' },
] as const;

export type CreneauLivraison = (typeof CRENEAUX_LIVRAISON)[number]['value'];

export function estCommuneTarifLocal(commune: string): boolean {
  return COMMUNES_TARIF_LOCAL.has(commune.trim());
}
