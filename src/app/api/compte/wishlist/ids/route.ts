import { NextResponse } from 'next/server';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { getCustomerSession } from '@/shared/lib/auth/session';

/** GET /api/compte/wishlist/ids — ids pour le provider client */
export async function GET() {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ productIds: [] });
  }

  const productIds = await customerAuthRepository.listerWishlistProductIds(session.id);
  return NextResponse.json({ productIds });
}
