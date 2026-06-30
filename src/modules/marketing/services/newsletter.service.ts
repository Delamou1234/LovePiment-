import { prisma } from '@/shared/lib/prisma';
import { STORE_SETTINGS_ID, storeSettingsService } from '@/modules/admin/services/store-settings.service';
import { resoudreOffreBienvenue } from '@/modules/marketing/services/welcome-offer.service';

const DEFAULT_IMAGE = '/images/love-piment-brand-story.png';

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
    const offre = await resoudreOffreBienvenue();
    await storeSettingsService.ensureSettings();
    const row = await prisma.storeSettings.findUnique({
      where: { id: STORE_SETTINGS_ID },
      select: {
        newsletterTitre: true,
        newsletterDescription: true,
        newsletterImageUrl: true,
      },
    });

    return {
      actif: offre.actif,
      titre: row?.newsletterTitre ?? 'Offre de bienvenue !',
      description:
        row?.newsletterDescription ??
        'Recevez votre code promo par e-mail en quelques secondes. Offre valable sur votre première commande, livraison discrète à Conakry.',
      remisePct: offre.remisePct,
      couponCode: offre.code,
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
      message: 'Parfait ! Votre code promo est prêt.',
      remisePct: config.remisePct,
      couponCode: config.couponCode,
    };
  }
}

export const newsletterService = new NewsletterService();
