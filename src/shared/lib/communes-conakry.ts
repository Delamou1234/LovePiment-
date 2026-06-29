/** Communes de référence Conakry / environs — enrichies par les données réelles en base. */
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
