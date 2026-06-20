import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { mockDb } from '@/shared/lib/mock-db';

const trackSchema = z.object({
  type: z.enum(['PAGE_VIEW', 'PRODUCT_VIEW', 'ADD_TO_CART', 'CHECKOUT_START', 'ORDER_PLACED']),
  path: z.string().optional(),
  productId: z.string().optional(),
  sessionId: z.string().optional(),
});

const isMock = process.env.MOCK_DATABASE === 'true';

/**
 * POST /api/track
 * Enregistre un événement analytics (mock en mémoire ou Prisma).
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

    if (isMock) {
      mockDb.saveAnalyticsEvent({ type, path, productId, sessionId, userAgent });
    } else {
      await prisma.analyticsEvent.create({
        data: {
          type,
          path,
          productId,
          sessionId,
          userAgent,
        },
      });
    }

    return NextResponse.json({ message: 'OK' });
  } catch (error) {
    console.error('[Track]', error);
    return NextResponse.json({ message: 'OK' });
  }
}
