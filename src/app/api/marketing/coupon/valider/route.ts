import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { marketingService } from '@/modules/marketing/services/marketing.service';
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

    const coupon = await marketingService.validerCoupon(
      parsed.data.code,
      parsed.data.sousTotal,
    );
    return NextResponse.json({ coupon });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Code invalide' },
      { status: 400 },
    );
  }
}
