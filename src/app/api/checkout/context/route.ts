import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { storeSettingsService } from '@/modules/admin/services/store-settings.service';
import { getCustomerSessionWithCourierFallback } from '@/shared/lib/auth/customer-from-courier';
import { resoudreOffreBienvenue } from '@/modules/marketing/services/welcome-offer.service';

/** GET /api/checkout/context — infos utiles au tunnel de commande */
export async function GET() {
  const session = await getCustomerSessionWithCourierFallback();
  const settings = await storeSettingsService.getSettings();
  const offre = await resoudreOffreBienvenue();

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
  const bienvenueActif = offre.actif && estPremiereCommande;

  return NextResponse.json({
    estPremiereCommande,
    bienvenueActif,
    codeBienvenue: offre.actif ? offre.code : null,
    remiseBienvenuePct: offre.remisePct,
    delaiLabel: settings.livraison.delaiLabel,
  });
}
