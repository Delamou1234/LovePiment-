import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { productService } from '@/modules/produits/services/product.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { revalidateBoutique } from '@/modules/produits/lib/revalidate-boutique';

function erreurPrisma(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return 'Ce slug est déjà utilisé';
    if (error.code === 'P2025') return 'Catégorie introuvable';
  }
  return error instanceof Error ? error.message : 'Erreur';
}

function mapCategory(c: Awaited<ReturnType<typeof productService.listerCategoriesAdmin>>[number]) {
  return {
    id: c.id,
    nom: c.nom,
    slug: c.slug,
    image: c.image,
    actif: c.actif,
    parentId: c.parentId,
    parent: c.parent,
    produitsCount: c._count.produits,
    childrenCount: c._count.children,
    createdAt: c.createdAt.toISOString(),
  };
}

/** GET /api/admin/categories */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const categories = await productService.listerCategoriesAdmin();
  return NextResponse.json({ categories: categories.map(mapCategory) });
}

const createSchema = z.object({
  nom: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).optional(),
  image: z.string().max(500).nullable().optional(),
  parentId: z.string().nullable().optional(),
  actif: z.boolean().optional(),
});

/** POST /api/admin/categories */
export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  try {
    const category = await productService.creerCategorie(parsed.data);
    revalidateBoutique();
    return NextResponse.json({ category: mapCategory(category) }, { status: 201 });
  } catch (error) {
    const message = erreurPrisma(error);
    const status = message.includes('slug') || message.includes('Slug') ? 409 : 400;
    return NextResponse.json({ message }, { status });
  }
}

const patchSchema = createSchema.partial().extend({ id: z.string() });

/** PATCH /api/admin/categories */
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const { id, ...data } = parsed.data;

  try {
    const category = await productService.mettreAJourCategorie(id, data);
    revalidateBoutique();
    return NextResponse.json({ category: mapCategory(category) });
  } catch (error) {
    const message = erreurPrisma(error);
    return NextResponse.json({ message }, { status: 400 });
  }
}

/** DELETE /api/admin/categories?id= */
export async function DELETE(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const id = request.nextUrl.searchParams.get('id');
  const reassignTo = request.nextUrl.searchParams.get('reassignTo') ?? undefined;
  if (!id) return NextResponse.json({ message: 'ID requis' }, { status: 400 });

  try {
    await productService.supprimerCategorie(id, reassignTo);
    revalidateBoutique();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: erreurPrisma(error) }, { status: 400 });
  }
}
