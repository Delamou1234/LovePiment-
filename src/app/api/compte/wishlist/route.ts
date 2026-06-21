import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { serialiserWishlistItems } from '@/modules/compte/lib/serialize-wishlist';
import { getCustomerSession } from '@/shared/lib/auth/session';

export async function GET() {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const items = await customerAuthRepository.listerWishlist(session.id);
  return NextResponse.json({ items: serialiserWishlistItems(items) });
}

const postSchema = z.object({ productId: z.string().min(1) });

export async function POST(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  await customerAuthRepository.ajouterWishlist(session.id, parsed.data.productId);
  return NextResponse.json({ ok: true }, { status: 201 });
}
