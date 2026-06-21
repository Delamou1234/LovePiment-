import { NextResponse } from 'next/server';
import { avisService } from '@/modules/avis/services/review.service';
import { getCustomerSession } from '@/shared/lib/auth/session';

/** GET /api/compte/avis/eligibles */
export async function GET() {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const eligibles = await avisService.listerEligibles(session.id);
  return NextResponse.json({ eligibles });
}
