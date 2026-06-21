import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { suggestionService } from '@/modules/ia/services/suggestion.service';

const suggestionsSchema = z.object({
  q: z.string().min(2, 'Minimum 2 caractères').max(100),
});

/**
 * GET /api/recherche/suggestions?q=robe
 * Autocomplétion produits + catégories (Gemini + fallback classique).
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') ?? '';
    const validation = suggestionsSchema.safeParse({ q });

    if (!validation.success) {
      return NextResponse.json({ suggestions: [], aiEnhanced: false });
    }

    const { suggestions, aiEnhanced } = await suggestionService.suggerer(validation.data.q);

    return NextResponse.json({ suggestions, query: validation.data.q, aiEnhanced });
  } catch (error) {
    console.error('[GET /api/recherche/suggestions]', error);
    return NextResponse.json({ suggestions: [], aiEnhanced: false }, { status: 500 });
  }
}
