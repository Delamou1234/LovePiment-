import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { storeSettingsService } from '@/modules/admin/services/store-settings.service';
import { getCustomerSessionWithCourierFallback } from '@/shared/lib/auth/customer-from-courier';

/** GET /api/checkout/context — infos utiles au tunnel de commande */
export async function GET() {
  const session = await getCustomerSessionWithCourierFallback();
  const settings = await storeSettingsService.getSettings();

  let commandesPayees = 0;
  if (session?.id) {
    commandesPayees = await prisma.order.count({
      where: {
        customerId: session.id,
        statut: { in: ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'] },
      },
    });
  }

  const estPremiereCommande = session?.id ? commandesPayees === 0 : true;
  const codeBienvenue = settings.newsletterCouponCode?.trim() || 'BIENVENUE10';

  return NextResponse.json({
    estPremiereCommande,
    codeBienvenue,
    remiseBienvenuePct: settings.newsletterRemisePct,
    delaiLabel: settings.livraison.delaiLabel,
  });
}
