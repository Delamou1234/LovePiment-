import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { getCustomerSession } from '@/shared/lib/auth/session';

type Params = Promise<{ id: string }>;

const patchSchema = z.object({
  label: z.string().max(50).nullable().optional(),
  adresse: z.string().min(5).max(300).optional(),
  ville: z.string().min(2).max(100).optional(),
  telephone: z.string().max(30).nullable().optional(),
  parDefaut: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const adresse = await customerAuthRepository.mettreAJourAdresse(session.id, id, parsed.data);
  if (!adresse) {
    return NextResponse.json({ message: 'Adresse introuvable' }, { status: 404 });
  }

  return NextResponse.json({ adresse });
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const { id } = await params;
  const ok = await customerAuthRepository.supprimerAdresse(session.id, id);
  if (!ok) {
    return NextResponse.json({ message: 'Adresse introuvable' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
