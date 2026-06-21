import { NextResponse } from 'next/server';
import { customerProfileService } from '@/modules/compte/services/customer-profile.service';
import { getCustomerSession } from '@/shared/lib/auth/session';

/** GET /api/compte/commandes */
export async function GET() {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const commandes = await customerProfileService.listerCommandes(session.id);
  return NextResponse.json({ commandes });
}
