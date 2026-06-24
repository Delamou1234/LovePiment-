import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
/** GET /api/admin/transporteurs */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const { prisma } = await import('@/shared/lib/prisma');
  const transporteurs = await prisma.carrier.findMany({ orderBy: { nom: 'asc' } });
  return NextResponse.json({ transporteurs });
}

const createSchema = z.object({
  nom: z.string().min(1),
  slug: z.string().min(1),
  telephone: z.string().optional(),
  delaiMinHeures: z.number().int().optional(),
  delaiMaxHeures: z.number().int().optional(),
  description: z.string().optional(),
});

/** POST /api/admin/transporteurs */
export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const { prisma } = await import('@/shared/lib/prisma');
  const transporteur = await prisma.carrier.create({ data: parsed.data });
  return NextResponse.json({ transporteur }, { status: 201 });
}
