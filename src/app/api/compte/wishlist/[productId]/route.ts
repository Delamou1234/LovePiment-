import { NextResponse } from 'next/server';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { getCustomerSession } from '@/shared/lib/auth/session';

type Params = Promise<{ productId: string }>;

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const { productId } = await params;
  await customerAuthRepository.retirerWishlist(session.id, productId);
  return NextResponse.json({ ok: true });
}
