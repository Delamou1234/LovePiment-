import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminCatalogService, type FiltreProduitAdmin } from '@/modules/admin/services/admin-catalog.service';
import { productService } from '@/modules/produits/services/product.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { revalidateBoutique } from '@/modules/produits/lib/revalidate-boutique';
import { revalidateTag } from 'next/cache';

const FILTRES: FiltreProduitAdmin[] = ['', 'actif', 'inactif', 'stock-faible', 'rupture', 'vedette'];

function parseFiltre(value: string | null): FiltreProduitAdmin {
  if (FILTRES.includes(value as FiltreProduitAdmin)) {
    return value as FiltreProduitAdmin;
  }
  return '';
}

/** GET /api/admin/produits?q=&filtre= */
export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const q = request.nextUrl.searchParams.get('q') ?? '';
  const filtre = parseFiltre(request.nextUrl.searchParams.get('filtre'));

  const data = await adminCatalogService.lister({ q, filtre });

  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}

const createSchema = z.object({
  nom: z.string().min(1),
  slug: z.string().optional(),
  marque: z.string().optional(),
  description: z.string().optional(),
  prix: z.number().positive(),
  images: z.array(z.string()).default([]),
  categorieId: z.string(),
  actif: z.boolean().optional(),
  featured: z.boolean().optional(),
  variantes: z
    .array(
      z.object({
        id: z.string().optional(),
        taille: z.string().optional(),
        couleur: z.string().optional(),
        capacite: z.string().optional(),
        stock: z.number().int().min(0),
        sku: z.string().optional(),
        codeBarre: z.string().optional(),
        prix: z.number().optional(),
      }),
    )
    .optional(),
});

function serializeProduct(p: Awaited<ReturnType<typeof productService.listerPourAdmin>>[number]) {
  return {
    ...p,
    prix: Number(p.prix),
    prixPromo: p.prixPromo ? Number(p.prixPromo) : null,
    variantes: p.variantes.map((v) => ({
      ...v,
      prix: v.prix ? Number(v.prix) : null,
    })),
  };
}

/** POST /api/admin/produits */
export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const produit = await productService.creerProduit({
    ...parsed.data,
    slug: parsed.data.slug ?? '',
    images: parsed.data.images,
  });

  revalidateBoutique({ productSlug: produit.slug });
  revalidateTag('admin-stats', 'max');

  return NextResponse.json({ produit: serializeProduct(produit as never) }, { status: 201 });
}
