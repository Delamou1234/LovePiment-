import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { productService } from '@/modules/produits/services/product.service';

// ─── Schéma de validation (Zod) ───────────────────────────────────────────────

const filtresSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
  categorieSlug: z.string().optional(),
  taille: z.string().optional(),
  couleur: z.string().optional(),
  marque: z.string().optional(),
  enStock: z.enum(['0', '1']).optional(),
  prixMin: z.coerce.number().optional(),
  prixMax: z.coerce.number().optional(),
  search: z.string().optional(),
  tri: z.enum(['prix_asc', 'prix_desc', 'nouveautes', 'nom_asc', 'popularite']).optional(),
});

// ─── GET /api/produits ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = Object.fromEntries(searchParams.entries());
    const validation = filtresSchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Paramètres invalides', errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { page, limit, categorieSlug, taille, couleur, marque, enStock, prixMin, prixMax, search, tri } =
      validation.data;

    const triMap = {
      prix_asc: { champ: 'prix' as const, ordre: 'asc' as const },
      prix_desc: { champ: 'prix' as const, ordre: 'desc' as const },
      nouveautes: { champ: 'createdAt' as const, ordre: 'desc' as const },
      nom_asc: { champ: 'nom' as const, ordre: 'asc' as const },
      popularite: { champ: 'featured' as const, ordre: 'desc' as const },
    };

    const result = await productService.listerProduits(
      {
        categorieSlug,
        taille,
        couleur,
        marque,
        enStock: enStock === '1' ? true : undefined,
        prix: prixMin !== undefined || prixMax !== undefined
          ? { min: prixMin, max: prixMax }
          : undefined,
        search,
      },
      tri ? triMap[tri] : undefined,
      { page, limit },
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/produits]', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
