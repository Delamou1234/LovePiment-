import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { avisService } from '@/modules/avis/services/review.service';
import { getCustomerSession } from '@/shared/lib/auth/session';

const schema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1),
  note: z.number().int().min(1).max(5),
  commentaire: z.string().min(10).max(2000),
  photos: z.array(z.string()).max(3).optional(),
});

/** POST /api/avis */
export async function POST(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  try {
    const avis = await avisService.creerAvis(session.id, parsed.data);
    revalidateTag('reviews', 'max');
    return NextResponse.json({ avis: { id: avis.id } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    const status = message.includes('déjà') ? 409 : 400;
    return NextResponse.json({ message }, { status });
  }
}
