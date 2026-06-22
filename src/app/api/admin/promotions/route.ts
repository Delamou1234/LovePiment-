import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { productService } from '@/modules/produits/services/product.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { revalidateBoutique } from '@/modules/produits/lib/revalidate-boutique';

/** GET /api/admin/promotions */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const produits = await productService.listerPourAdmin();
  return NextResponse.json({
    produits: produits.map((p) => ({
      id: p.id,
      nom: p.nom,
      slug: p.slug,
      prix: Number(p.prix),
      prixPromo: p.prixPromo ? Number(p.prixPromo) : null,
      promoDebut: p.promoDebut?.toISOString() ?? null,
      promoFin: p.promoFin?.toISOString() ?? null,
      featured: p.featured,
      actif: p.actif,
      images: p.images,
    })),
  });
}

const patchSchema = z.object({
  productId: z.string(),
  prixPromo: z.number().nullable().optional(),
  promoDebut: z.string().nullable().optional(),
  promoFin: z.string().nullable().optional(),
  featured: z.boolean().optional(),
});

/** PATCH /api/admin/promotions */
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const { productId, ...data } = parsed.data;
  const produit = await productService.mettreAJourPromo(productId, data);
  revalidateBoutique();

  return NextResponse.json({
    produit: {
      id: produit.id,
      prixPromo: produit.prixPromo ? Number(produit.prixPromo) : null,
      promoDebut: produit.promoDebut?.toISOString() ?? null,
      promoFin: produit.promoFin?.toISOString() ?? null,
      featured: produit.featured,
    },
  });
}
