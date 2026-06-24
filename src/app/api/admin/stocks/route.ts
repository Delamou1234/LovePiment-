import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { productService } from '@/modules/produits/services/product.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { revalidateBoutique } from '@/modules/produits/lib/revalidate-boutique';
import { revalidateTag } from 'next/cache';

/** GET /api/admin/stocks */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const stocks = await productService.listerStocks();
  return NextResponse.json(
    {
      stocks: stocks.map((s) => ({
        id: s.id,
        taille: s.taille,
        couleur: s.couleur,
        capacite: s.capacite,
        stock: s.stock,
        sku: s.sku,
        codeBarre: s.codeBarre,
        produit: s.produit,
      })),
      updatedAt: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

const patchSchema = z.object({
  variantId: z.string(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().nullable().optional(),
  codeBarre: z.string().nullable().optional(),
  capacite: z.string().nullable().optional(),
});

/** PATCH /api/admin/stocks */
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const { variantId, stock, sku, codeBarre, capacite } = parsed.data;

  const variant =
    stock !== undefined
      ? await productService.mettreAJourStock(variantId, stock)
      : await productService.mettreAJourVariante(variantId, {
          ...(sku !== undefined && { sku }),
          ...(codeBarre !== undefined && { codeBarre }),
          ...(capacite !== undefined && { capacite }),
          ...(stock !== undefined && { stock }),
        });

  revalidateBoutique();
  revalidateTag('admin-stats', 'max');

  return NextResponse.json({ variant: { id: variant.id, stock: variant.stock } });
}
