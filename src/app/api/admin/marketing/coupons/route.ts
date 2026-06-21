import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

function mapCoupon(c: Awaited<ReturnType<typeof marketingService.listerCouponsAdmin>>[number]) {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    valeur: Number(c.valeur),
    minCommande: c.minCommande ? Number(c.minCommande) : null,
    maxUtilisations: c.maxUtilisations,
    utilisations: c.utilisations,
    actif: c.actif,
    debut: c.debut?.toISOString() ?? null,
    fin: c.fin?.toISOString() ?? null,
  };
}

/** GET /api/admin/marketing/coupons */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const coupons = await marketingService.listerCouponsAdmin();
  return NextResponse.json({ coupons: coupons.map(mapCoupon) });
}

const createSchema = z.object({
  code: z.string().min(2).max(40),
  type: z.enum(['POURCENT', 'MONTANT_FIXE']),
  valeur: z.number().min(1),
  minCommande: z.number().nullable().optional(),
  maxUtilisations: z.number().int().nullable().optional(),
  actif: z.boolean().optional(),
  debut: z.string().nullable().optional(),
  fin: z.string().nullable().optional(),
});

/** POST /api/admin/marketing/coupons */
export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  try {
    const coupon = await marketingService.creerCoupon({
      ...parsed.data,
      debut: parsed.data.debut ? new Date(parsed.data.debut) : null,
      fin: parsed.data.fin ? new Date(parsed.data.fin) : null,
    });
    return NextResponse.json({ coupon: mapCoupon(coupon) }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Code déjà utilisé' }, { status: 409 });
  }
}

const patchSchema = createSchema.partial().extend({ id: z.string() });

/** PATCH /api/admin/marketing/coupons */
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const { id, ...data } = parsed.data;
  const coupon = await marketingService.mettreAJourCoupon(id, {
    ...data,
    debut: data.debut !== undefined ? (data.debut ? new Date(data.debut) : null) : undefined,
    fin: data.fin !== undefined ? (data.fin ? new Date(data.fin) : null) : undefined,
  });
  return NextResponse.json({ coupon: mapCoupon(coupon) });
}

/** DELETE /api/admin/marketing/coupons?id= */
export async function DELETE(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'ID requis' }, { status: 400 });

  await marketingService.supprimerCoupon(id);
  return NextResponse.json({ ok: true });
}
