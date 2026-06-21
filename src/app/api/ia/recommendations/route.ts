import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recommendationService } from '@/modules/ia/services/recommendation.service';

const querySchema = z.object({
  viewed: z.string().optional(),
  cart: z.string().optional(),
  exclude: z.string().optional(),
  productId: z.string().optional(),
  categorieId: z.string().optional(),
  mode: z.enum(['personalise', 'similaires']).optional(),
  limit: z.coerce.number().int().min(1).max(12).optional(),
});

/** GET /api/ia/recommendations — recommandations personnalisées Gemini */
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ products: [], poweredByAi: false });
    }

    const { viewed, cart, exclude, productId, categorieId, mode, limit } = parsed.data;
    const viewedIds = viewed?.split(',').filter(Boolean) ?? [];
    const cartIds = cart?.split(',').filter(Boolean) ?? [];

    if (mode === 'similaires' && productId && categorieId) {
      const result = await recommendationService.recommanderSimilairesIa(
        productId,
        categorieId,
        limit ?? 4,
      );
      return NextResponse.json(result);
    }

    const result = await recommendationService.recommanderPersonnalise({
      viewedProductIds: viewedIds,
      cartProductIds: cartIds,
      excludeProductId: exclude,
      limit: limit ?? 8,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/ia/recommendations]', error);
    return NextResponse.json({ products: [], poweredByAi: false });
  }
}
