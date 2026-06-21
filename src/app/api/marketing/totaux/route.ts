import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import { getCustomerSession } from '@/shared/lib/auth/session';

const schema = z.object({
  sousTotal: z.number().min(0),
  clientVille: z.string().min(1),
  codeCoupon: z.string().optional().nullable(),
  pointsUtilises: z.number().int().min(0).optional(),
  codeParrainage: z.string().optional().nullable(),
});

/** POST /api/marketing/totaux */
export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
    }

    const totaux = await marketingService.calculerTotaux({
      ...parsed.data,
      customerId: session?.id,
    });
    return NextResponse.json({ totaux });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Calcul impossible' },
      { status: 400 },
    );
  }
}
