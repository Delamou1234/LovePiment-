import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { productService } from '@/modules/produits/services/product.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

type Params = Promise<{ id: string }>;

const variantesSchema = z.object({
  variantes: z.array(
    z.object({
      id: z.string().optional(),
      taille: z.string().optional(),
      couleur: z.string().optional(),
      capacite: z.string().optional(),
      stock: z.number().int().min(0),
      sku: z.string().optional(),
      codeBarre: z.string().optional(),
      prix: z.number().optional(),
    }),
  ),
});

/** PUT /api/admin/produits/[id]/variantes */
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const { id } = await params;
  const body = await request.json();
  const parsed = variantesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  try {
    const produit = await productService.synchroniserVariantes(id, parsed.data.variantes);
    revalidateTag('products', 'max');
    return NextResponse.json({
      produit: {
        ...produit,
        prix: Number(produit.prix),
        prixPromo: produit.prixPromo ? Number(produit.prixPromo) : null,
        variantes: produit.variantes.map((v) => ({
          ...v,
          prix: v.prix ? Number(v.prix) : null,
        })),
      },
    });
  } catch (error) {
    console.error('[PUT /api/admin/produits/[id]/variantes]', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    const status = message.includes('introuvable') ? 404 : 500;
    return NextResponse.json({ message }, { status });
  }
}
