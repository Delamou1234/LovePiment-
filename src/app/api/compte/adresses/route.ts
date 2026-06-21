import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { getCustomerSession } from '@/shared/lib/auth/session';

const createSchema = z.object({
  label: z.string().max(50).optional(),
  adresse: z.string().min(5).max(300),
  ville: z.string().min(2).max(100),
  telephone: z.string().max(30).optional(),
  parDefaut: z.boolean().optional(),
});

export async function GET() {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const adresses = await customerAuthRepository.listerAdresses(session.id);
  return NextResponse.json({
    adresses: adresses.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const adresse = await customerAuthRepository.creerAdresse(session.id, parsed.data);
  return NextResponse.json({ adresse }, { status: 201 });
}
