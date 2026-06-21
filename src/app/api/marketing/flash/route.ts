import { NextResponse } from 'next/server';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import { productService } from '@/modules/produits/services/product.service';

/** GET /api/marketing/flash — vente flash active */
export async function GET() {
  const flash = await marketingService.obtenirFlashActive();
  if (!flash) {
    return NextResponse.json({ flash: null, produits: [] });
  }

  const produits =
    flash.productIds.length > 0
      ? await productService.obtenirProduitsParIds(flash.productIds)
      : [];

  return NextResponse.json({
    flash: {
      id: flash.id,
      titre: flash.titre,
      slug: flash.slug,
      description: flash.description,
      debut: flash.debut.toISOString(),
      fin: flash.fin.toISOString(),
    },
    produits,
  });
}
