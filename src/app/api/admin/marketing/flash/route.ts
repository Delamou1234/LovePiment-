import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

function mapFlash(f: Awaited<ReturnType<typeof marketingService.listerFlashSalesAdmin>>[number]) {
  return {
    id: f.id,
    titre: f.titre,
    slug: f.slug,
    description: f.description,
    debut: f.debut.toISOString(),
    fin: f.fin.toISOString(),
    actif: f.actif,
    productIds: f.productIds,
  };
}

/** GET /api/admin/marketing/flash */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const flashSales = await marketingService.listerFlashSalesAdmin();
  return NextResponse.json({ flashSales: flashSales.map(mapFlash) });
}

const createSchema = z.object({
  titre: z.string().min(2).max(120),
  slug: z.string().min(2).max(80),
  description: z.string().nullable().optional(),
  debut: z.string(),
  fin: z.string(),
  actif: z.boolean().optional(),
  productIds: z.array(z.string()).default([]),
});

/** POST /api/admin/marketing/flash */
export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  try {
    const flash = await marketingService.creerFlashSale({
      ...parsed.data,
      debut: new Date(parsed.data.debut),
      fin: new Date(parsed.data.fin),
    });
    return NextResponse.json({ flash: mapFlash(flash) }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Slug déjà utilisé' }, { status: 409 });
  }
}

const patchSchema = createSchema.partial().extend({ id: z.string() });

/** PATCH /api/admin/marketing/flash */
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const { id, ...data } = parsed.data;
  const flash = await marketingService.mettreAJourFlashSale(id, {
    ...data,
    ...(data.debut !== undefined && { debut: new Date(data.debut) }),
    ...(data.fin !== undefined && { fin: new Date(data.fin) }),
  });
  return NextResponse.json({ flash: mapFlash(flash) });
}

/** DELETE /api/admin/marketing/flash?id= */
export async function DELETE(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'ID requis' }, { status: 400 });

  await marketingService.supprimerFlashSale(id);
  return NextResponse.json({ ok: true });
}
