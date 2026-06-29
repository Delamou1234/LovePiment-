import { NextResponse } from 'next/server';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import { getCustomerSession } from '@/shared/lib/auth/session';

/** GET /api/compte/offres — bons & codes promo actifs */
export async function GET() {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  try {
    const offres = await marketingService.listerOffresPubliques(12);
    return NextResponse.json({ offres });
  } catch (error) {
    console.error('[GET /api/compte/offres]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
