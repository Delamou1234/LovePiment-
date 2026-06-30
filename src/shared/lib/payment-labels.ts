/** Mode de paiement unique de la boutique. */
export const MODE_PAIEMENT_BOUTIQUE = 'ORANGE_MONEY' as const;

export type ModePaiementBoutique = typeof MODE_PAIEMENT_BOUTIQUE;

export function libelleModePaiement(_mode?: string): string {
  return 'Orange Money';
}

export function estPaiementEnLigne(_mode?: string): boolean {
  return true;
}
