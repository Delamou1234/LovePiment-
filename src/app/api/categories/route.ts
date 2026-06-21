import { NextResponse } from 'next/server';
import { productService } from '@/modules/produits/services/product.service';
import { categorieVersVitrine } from '@/modules/produits/lib/category-showcase';

/** GET /api/categories — catégories actives (vitrine + arbre) */
export async function GET() {
  const [vitrine, arbre] = await Promise.all([
    productService.listerCategoriesVitrine(),
    productService.listerCategoriesArbre(),
  ]);

  return NextResponse.json({
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
  });
}
