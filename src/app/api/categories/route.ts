import { NextResponse } from 'next/server';
import { getCachedCategoriesApi } from '@/modules/produits/lib/cached-queries';
import { categorieVersVitrine } from '@/modules/produits/lib/category-showcase';
import { cachePublic } from '@/shared/lib/http-cache';

/** GET /api/categories — catégories actives (cache 5 min, invalidé après mutation admin). */
export async function GET() {
  const { vitrine, arbre } = await getCachedCategoriesApi();

  return NextResponse.json(
    {
      vitrine: vitrine.map(categorieVersVitrine),
      arbre: arbre.map((root) => ({
        id: root.id,
        nom: root.nom,
        slug: root.slug,
        image: root.image,
        children: root.children.map((c) => ({
          id: c.id,
          nom: c.nom,
          slug: c.slug,
          image: c.image,
        })),
      })),
    },
    { headers: cachePublic(300) },
  );
}
