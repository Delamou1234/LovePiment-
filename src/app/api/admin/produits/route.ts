import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { productService } from '@/modules/produits/services/product.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

function serializeProduct(p: Awaited<ReturnType<typeof productService.listerPourAdmin>>[number]) {
  return {
    ...p,
    prix: Number(p.prix),
    prixPromo: p.prixPromo ? Number(p.prixPromo) : null,
    variantes: p.variantes.map((v) => ({
      ...v,
      prix: v.prix ? Number(v.prix) : null,
    })),
  };
}

const createSchema = z.object({
  nom: z.string().min(1),
  slug: z.string().optional(),
  marque: z.string().optional(),
  description: z.string().optional(),
  prix: z.number().positive(),
  images: z.array(z.string()).default([]),
  categorieId: z.string(),
  actif: z.boolean().optional(),
  featured: z.boolean().optional(),
  variantes: z
    .array(
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
    )
    .optional(),
});

/** GET /api/admin/produits */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const [produits, categories] = await Promise.all([
    productService.listerPourAdmin(),
    productService.listerCategoriesAdmin(),
  ]);

  return NextResponse.json({
    produits: produits.map(serializeProduct),
    categories: categories.map((c) => ({
      id: c.id,
      nom: c.nom,
      slug: c.slug,
      actif: c.actif,
      parentId: c.parentId,
      parentNom: c.parent?.nom ?? null,
    })),
  });
}

/** POST /api/admin/produits */
export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const produit = await productService.creerProduit({
    ...parsed.data,
    slug: parsed.data.slug ?? '',
    images: parsed.data.images,
  });

  revalidateTag('products', 'max');
  revalidateTag('promos', 'max');

  return NextResponse.json({ produit: serializeProduct(produit as never) }, { status: 201 });
}
