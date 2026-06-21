import { NextRequest, NextResponse } from 'next/server';
import { getCachedProductStock } from '@/modules/produits/lib/cached-queries';
import { cachePublic } from '@/shared/lib/http-cache';

type Params = Promise<{ slug: string }>;

/** GET /api/produits/[slug]/stock — stock par variante (cache 15 s CDN). */
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { slug } = await params;
    const variantes = await getCachedProductStock(slug);
    return NextResponse.json(
      { variantes, updatedAt: new Date().toISOString() },
      { headers: cachePublic(15, 30) },
    );
  } catch (error) {
    console.error('[GET /api/produits/[slug]/stock]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
