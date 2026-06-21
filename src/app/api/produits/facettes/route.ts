import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { productService } from '@/modules/produits/services/product.service';

const filtresSchema = z.object({
  categorieSlug: z.string().optional(),
  taille: z.string().optional(),
  couleur: z.string().optional(),
  marque: z.string().optional(),
  enStock: z.enum(['0', '1']).optional(),
  search: z.string().optional(),
  promo: z.enum(['0', '1']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validation = filtresSchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json({ message: 'Paramètres invalides' }, { status: 400 });
    }

    const { categorieSlug, taille, couleur, marque, enStock, search, promo } = validation.data;

    const facettes = await productService.obtenirFacettesCatalogue({
      categorieSlug,
      taille,
      couleur,
      marque,
      enStock: enStock === '1' ? true : undefined,
      search,
      enPromo: promo === '1' ? true : undefined,
    });

    return NextResponse.json(facettes);
  } catch (error) {
    console.error('[GET /api/produits/facettes]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
