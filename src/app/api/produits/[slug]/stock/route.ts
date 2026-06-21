import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/modules/produits/services/product.service';

type Params = Promise<{ slug: string }>;

/** GET /api/produits/[slug]/stock — stock en temps réel par variante */
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { slug } = await params;
    const variantes = await productService.obtenirStockParSlug(slug);
    return NextResponse.json(
      { variantes, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (error) {
    console.error('[GET /api/produits/[slug]/stock]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
