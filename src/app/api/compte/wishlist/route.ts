import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { getCustomerSession } from '@/shared/lib/auth/session';

export async function GET() {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const items = await customerAuthRepository.listerWishlist(session.id);
  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      addedAt: item.createdAt.toISOString(),
      product: {
        id: item.product.id,
        nom: item.product.nom,
        slug: item.product.slug,
        prix: Number(item.product.prix),
        prixPromo: item.product.prixPromo ? Number(item.product.prixPromo) : null,
        image: item.product.images[0] ?? null,
        categorie: item.product.categorie.nom,
        enStock: (item.product.variantes?.[0]?.stock ?? 0) > 0,
        variante: item.product.variantes?.[0]
          ? {
              id: item.product.variantes[0].id,
              stock: item.product.variantes[0].stock,
            }
          : null,
      },
    })),
  });
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
