import { prisma } from '@/shared/lib/prisma';
import { STORE_SETTINGS_ID, storeSettingsService } from '@/modules/admin/services/store-settings.service';

export type OffreBienvenue = {
  /** Offre activée par l'admin et coupon valide en base */
  actif: boolean;
  code: string | null;
  remisePct: number;
};

/** Résout l'offre de bienvenue (paramètres admin + coupon actif). */
export async function resoudreOffreBienvenue(): Promise<OffreBienvenue> {
  await storeSettingsService.ensureSettings();
  const row = await prisma.storeSettings.findUnique({
    where: { id: STORE_SETTINGS_ID },
    select: {
      newsletterActif: true,
      newsletterCouponCode: true,
      newsletterRemisePct: true,
    },
  });

  if (!row?.newsletterActif) {
    return { actif: false, code: null, remisePct: 0 };
  }

  const code = row.newsletterCouponCode?.trim().toUpperCase();
  if (!code) {
    return { actif: false, code: null, remisePct: 0 };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code },
    select: { actif: true, type: true, valeur: true, premiereCommandeOnly: true },
  });

  if (!coupon?.actif) {
    return { actif: false, code: null, remisePct: 0 };
  }

  let remisePct = row.newsletterRemisePct ?? 10;
  if (coupon.type === 'POURCENT') {
    remisePct = Math.round(Number(coupon.valeur));
  }

  return { actif: true, code, remisePct };
}

/** Code coupon bienvenue à appliquer automatiquement sur une 1ʳᵉ commande (si offre active). */
export async function codeCouponBienvenueAuto(estPremiereCommande: boolean): Promise<string | null> {
  if (!estPremiereCommande) return null;
  const offre = await resoudreOffreBienvenue();
  return offre.actif && offre.code ? offre.code : null;
}
