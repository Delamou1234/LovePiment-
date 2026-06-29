import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import { getCustomerSessionWithCourierFallback } from '@/shared/lib/auth/customer-from-courier';
import { marketingRepository } from '@/modules/marketing/repository/marketing.repository';
const schema = z.object({
  code: z.string().min(2).max(40),
  sousTotal: z.number().min(0),
});

/** POST /api/marketing/coupon/valider */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
    }

    const session = await getCustomerSessionWithCourierFallback();
    let estPremiereCommande: boolean | undefined;
    if (session?.id) {
      const payees = await marketingRepository.compterCommandesPayees(session.id);
      estPremiereCommande = payees === 0;
    }

    const coupon = await marketingService.validerCoupon(
      parsed.data.code,
      parsed.data.sousTotal,
      { customerId: session?.id, estPremiereCommande },
    );
    return NextResponse.json({ coupon });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Code invalide' },
      { status: 400 },
    );
  }
}
