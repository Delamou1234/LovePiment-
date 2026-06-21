import { NextRequest, NextResponse } from 'next/server';
import { trackingService } from '@/modules/livraison/services/tracking.service';

type Params = Promise<{ token: string }>;

/** GET /api/suivi/[token] — données de suivi publiques */
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const { token } = await params;
  const suivi = await trackingService.obtenirSuiviParToken(token);

  if (!suivi) {
    return NextResponse.json({ message: 'Suivi introuvable' }, { status: 404 });
  }

  return NextResponse.json(suivi);
}
