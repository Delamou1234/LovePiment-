import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackingService } from '@/modules/livraison/services/tracking.service';

type Params = Promise<{ token: string }>;

const bodySchema = z.object({
  statut: z.enum(['SATISFAIT', 'NON_SATISFAIT']),
  commentaire: z.string().max(500).optional(),
});

/** POST /api/suivi/[token]/satisfaction — avis client après livraison */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { token } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  try {
    const suivi = await trackingService.enregistrerSatisfaction(
      token,
      parsed.data.statut,
      parsed.data.commentaire,
    );
    return NextResponse.json({ suivi });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    const status = message.includes('déjà') ? 409 : message.includes('livrée') ? 403 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
