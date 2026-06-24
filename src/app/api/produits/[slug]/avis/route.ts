import { NextRequest, NextResponse } from 'next/server';
import { avisService } from '@/modules/avis/services/review.service';
import { productService } from '@/modules/produits/services/product.service';

type Params = Promise<{ slug: string }>;

/** GET /api/produits/[slug]/avis */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const page = Number(request.nextUrl.searchParams.get('page') ?? '1');

  try {
    const produit = await productService.obtenirProduit(slug);
    const [stats, { avis, pagination }] = await Promise.all([
      avisService.statsProduit(produit.id),
      avisService.listerAvisProduit(produit.id, page, 10),
    ]);

    return NextResponse.json({ stats, avis, pagination });
  } catch {
    return NextResponse.json({ message: 'Produit introuvable' }, { status: 404 });
  }
}
