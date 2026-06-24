import { prisma } from '@/shared/lib/prisma';
import { STORE_SETTINGS_ID, storeSettingsService } from '@/modules/admin/services/store-settings.service';

const DEFAULT_IMAGE = '/images/love-piment-secret.png';

export type NewsletterPublicConfig = {
  actif: boolean;
  titre: string;
  description: string;
  remisePct: number;
  couponCode: string | null;
  imageUrl: string;
};

export class NewsletterService {
  async getPublicConfig(): Promise<NewsletterPublicConfig> {
    await storeSettingsService.ensureSettings();
    const row = await prisma.storeSettings.findUnique({
      where: { id: STORE_SETTINGS_ID },
      select: {
        newsletterActif: true,
        newsletterTitre: true,
        newsletterDescription: true,
        newsletterImageUrl: true,
        newsletterRemisePct: true,
        newsletterCouponCode: true,
      },
    });

    let remisePct = row?.newsletterRemisePct ?? 10;
    const couponCode = row?.newsletterCouponCode?.trim() || null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
        select: { type: true, valeur: true, actif: true },
      });
      if (coupon?.actif && coupon.type === 'POURCENT') {
        remisePct = Math.round(Number(coupon.valeur));
      }
    }

    return {
      actif: row?.newsletterActif ?? true,
      titre: row?.newsletterTitre ?? 'Offre de bienvenue !',
      description:
        row?.newsletterDescription ??
        'Inscrivez-vous et recevez des offres exclusives 🧡',
      remisePct,
      couponCode,
      imageUrl: row?.newsletterImageUrl?.trim() || DEFAULT_IMAGE,
    };
  }

  async subscribe(emailRaw: string, source = 'homepage') {
    const email = emailRaw.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Adresse e-mail invalide');
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { actif: true, source },
      create: { email, source, actif: true },
    });

    const config = await this.getPublicConfig();
    return {
      message: 'Inscription confirmée ! Consultez votre boîte mail.',
      remisePct: config.remisePct,
      couponCode: config.couponCode,
    };
  }
}

export const newsletterService = new NewsletterService();
