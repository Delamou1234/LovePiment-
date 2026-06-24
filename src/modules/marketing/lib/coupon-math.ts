export type CouponRemiseInput = {
  type: 'POURCENT' | 'MONTANT_FIXE';
  valeur: number;
  sousTotal: number;
};

export function calculerRemiseCoupon({ type, valeur, sousTotal }: CouponRemiseInput): number {
  const base = Math.max(0, sousTotal);
  if (type === 'POURCENT') {
    return Math.min(Math.round((base * valeur) / 100), base);
  }
  return Math.min(valeur, base);
}

export type CouponValidationInput = {
  actif: boolean;
  debut: Date | null;
  fin: Date | null;
  utilisations: number;
  maxUtilisations: number | null;
  minCommande: number | null;
  sousTotal: number;
};

export function getCouponValidationError(
  coupon: CouponValidationInput,
  now = new Date(),
): string | null {
  if (!coupon.actif) return 'Code promo invalide ou expiré';
  if (coupon.debut && coupon.debut > now) return "Ce code promo n'est pas encore actif";
  if (coupon.fin && coupon.fin < now) return 'Ce code promo a expiré';
  if (coupon.maxUtilisations != null && coupon.utilisations >= coupon.maxUtilisations) {
    return "Ce code promo a atteint sa limite d'utilisation";
  }
  if (coupon.minCommande != null && coupon.sousTotal < coupon.minCommande) {
    return `Minimum de commande : ${coupon.minCommande.toLocaleString('fr-FR')} GN`;
  }
  return null;
}
