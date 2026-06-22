import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { productService } from '@/modules/produits/services/product.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { revalidateBoutique } from '@/modules/produits/lib/revalidate-boutique';

type Params = Promise<{ id: string }>;

const patchSchema = z.object({
  nom: z.string().min(1).optional(),
  marque: z.string().optional(),
  description: z.string().optional(),
  prix: z.number().positive().optional(),
  images: z.array(z.string()).optional(),
  categorieId: z.string().optional(),
  actif: z.boolean().optional(),
  featured: z.boolean().optional(),
});

/** PATCH /api/admin/produits/[id] */
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  try {
    const produit = await productService.modifierProduit(id, parsed.data);
    revalidateBoutique({ productSlug: produit.slug });
    return NextResponse.json({
      produit: {
        ...produit,
        prix: Number(produit.prix),
        prixPromo: produit.prixPromo ? Number(produit.prixPromo) : null,
      },
    });
  } catch {
    return NextResponse.json({ message: 'Produit introuvable' }, { status: 404 });
  }
}

/** DELETE /api/admin/produits/[id] */
export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const { id } = await params;
  try {
    const existant = await productService.obtenirProduitParId(id);
    await productService.supprimerProduit(id);
    revalidateBoutique({ productSlug: existant.slug });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: 'Produit introuvable' }, { status: 404 });
  }
}

/** POST /api/admin/produits/[id] — toggle actif */
export async function POST(_request: NextRequest, { params }: { params: Params }) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const { id } = await params;
  const result = await productService.toggleActif(id);
  revalidateBoutique();
  return NextResponse.json(result);
}
