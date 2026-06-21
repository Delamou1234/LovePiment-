import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';

const trackSchema = z.object({
  type: z.enum(['PAGE_VIEW', 'PRODUCT_VIEW', 'ADD_TO_CART', 'CHECKOUT_START', 'ORDER_PLACED']),
  path: z.string().optional(),
  productId: z.string().optional(),
  sessionId: z.string().optional(),
});

/**
 * POST /api/track — réponse immédiate, écriture DB en arrière-plan.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const validation = trackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') ?? undefined;
    const { type, path, productId, sessionId } = validation.data;

    after(async () => {
      try {
        await prisma.analyticsEvent.create({
          data: { type, path, productId, sessionId, userAgent },
        });
      } catch (error) {
        console.error('[Track]', error);
      }
    });

    return NextResponse.json({ message: 'OK' });
  } catch (error) {
    console.error('[Track]', error);
    return NextResponse.json({ message: 'OK' });
  }
}
