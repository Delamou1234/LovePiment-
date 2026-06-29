import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

type Params = Promise<{ id: string }>;

const schema = z.object({
  notesAdmin: z.string().max(2000).nullable(),
});

/** PATCH /api/admin/clients/[id]/notes */
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: { notesAdmin: parsed.data.notesAdmin },
    select: { id: true, notesAdmin: true },
  });

  return NextResponse.json({ ok: true, notesAdmin: customer.notesAdmin });
}
