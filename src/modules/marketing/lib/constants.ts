/** Règles fidélité & parrainage Love Piment&. */
export const LOYALTY = {
  /** 1 point gagné par tranche de 1 000 GN dépensés (total TTC). */
  POINTS_PAR_1000_GN: 1,
  /** Valeur monétaire d'un point en GN. */
  VALEUR_POINT_GN: 50,
  /** Plafond de remise via points (20 % du sous-total articles). */
  MAX_REMISE_POINTS_PCT: 0.2,
  /** Points crédités au parrain après la 1ère commande payée du filleul. */
  PARRAIN_POINTS: 100,
  /** Remise filleul sur la première commande (5 %). */
  FILLEUL_REMISE_PCT: 0.05,
} as const;
