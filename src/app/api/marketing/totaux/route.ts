import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import { getCustomerSessionWithCourierFallback } from '@/shared/lib/auth/customer-from-courier';
import { marketingRepository } from '@/modules/marketing/repository/marketing.repository';

const schema = z.object({
  sousTotal: z.number().min(0),
  clientVille: z.string().min(1),
  clientCommune: z.string().optional().nullable(),
  codeCoupon: z.string().optional().nullable(),
  pointsUtilises: z.number().int().min(0).optional(),
  codeParrainage: z.string().optional().nullable(),
  estPremiereCommande: z.boolean().optional(),
});

/** POST /api/marketing/totaux */
export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSessionWithCourierFallback();
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
    }

    let estPremiereCommande = parsed.data.estPremiereCommande;
    if (estPremiereCommande === undefined && session?.id) {
      const payees = await marketingRepository.compterCommandesPayees(session.id);
      estPremiereCommande = payees === 0;
    }

    const totaux = await marketingService.calculerTotaux({
      ...parsed.data,
      customerId: session?.id,
      estPremiereCommande,
    });
    return NextResponse.json({ totaux });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Calcul impossible' },
      { status: 400 },
    );
  }
}
