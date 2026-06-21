import { NextRequest, NextResponse } from 'next/server';
import { imageSearchService } from '@/modules/recherche/services/image-search.service';

/**
 * POST /api/recherche/image
 * Recherche visuelle : compare l'image envoyée aux photos produits.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: 'Fichier image requis' }, { status: 400 });
    }

    const validationError = imageSearchService.validerFichier(file);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const results = await imageSearchService.rechercherParImage(buffer, file.type);

    return NextResponse.json({
      results,
      count: results.length,
      poweredByAi: results.some((r) => r.source === 'ia'),
    });
  } catch (error) {
    console.error('[POST /api/recherche/image]', error);
    return NextResponse.json(
      { message: 'Impossible d\'analyser cette image. Réessayez.' },
      { status: 500 },
    );
  }
}
