import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { isBeautyProfileComplete, type BeautyProfile } from '@/modules/ia/lib/beauty-profile';
import { getCustomerSession } from '@/shared/lib/auth/session';

const profileSchema = z.object({
  typePeau: z.enum(['seche', 'normale', 'mixte', 'grasse']),
  preoccupations: z
    .array(z.enum(['hydratation', 'parfum', 'cheveux', 'eclat', 'souplesse', 'relaxation']))
    .min(1),
  univers: z
    .array(z.enum(['sextoys', 'lingerie', 'lubrifiants', 'accessoires']))
    .min(1),
  familleParfum: z
    .enum(['floral', 'boise', 'fruite', 'oriental', 'frais'])
    .nullable()
    .optional(),
  budget: z.enum(['accessible', 'confort', 'premium']),
  completedAt: z.string(),
});

const putSchema = z.object({
  profile: profileSchema,
});

function unauthorized() {
  return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
}

function parseStoredProfile(value: unknown): BeautyProfile | null {
  if (!value || typeof value !== 'object') return null;
  return isBeautyProfileComplete(value as BeautyProfile) ? (value as BeautyProfile) : null;
}

/** GET /api/compte/beauty-profile — profil beauté du client connecté */
export async function GET() {
  const session = await getCustomerSession();
  if (!session?.id) return unauthorized();

  const customer = await customerAuthRepository.trouverParId(session.id);
  if (!customer) return unauthorized();

  return NextResponse.json({ profile: parseStoredProfile(customer.beautyProfile) });
}

/** PUT /api/compte/beauty-profile — enregistrer le profil beauté */
export async function PUT(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session?.id) return unauthorized();

  const body = await request.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Données invalides' },
      { status: 400 },
    );
  }

  const profile = parsed.data.profile;
  if (!isBeautyProfileComplete(profile)) {
    return NextResponse.json({ message: 'Profil incomplet' }, { status: 400 });
  }

  await customerAuthRepository.mettreAJourProfilBeaute(session.id, profile);
  return NextResponse.json({ profile, message: 'Profil intime enregistré' });
}
