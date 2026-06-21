import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import { getCustomerSession } from '@/shared/lib/auth/session';

const lierSchema = z.object({
  code: z.string().min(4).max(40),
});

/** GET /api/compte/parrainage — statut parrain / filleul */
export async function GET() {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  try {
    const statut = await marketingService.obtenirStatutParrainage(session.id);
    return NextResponse.json({ statut });
  } catch (error) {
    console.error('[GET /api/compte/parrainage]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

/** POST /api/compte/parrainage — rattacher un parrain (avant 1ère commande) */
export async function POST(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = lierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Code invalide' },
        { status: 400 },
      );
    }

    await marketingService.lierParrain(session.id, parsed.data.code);
    const statut = await marketingService.obtenirStatutParrainage(session.id);
    return NextResponse.json({ ok: true, statut });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    const clientError =
      message.includes('invalide') ||
      message.includes('propre') ||
      message.includes('déjà') ||
      message.includes('première commande') ||
      message.includes('requis');
    return NextResponse.json({ message }, { status: clientError ? 400 : 500 });
  }
}
