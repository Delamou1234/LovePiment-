import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { customerProfileService } from '@/modules/compte/services/customer-profile.service';
import { AVATAR_COULEURS } from '@/modules/compte/types';
import {
  createSessionToken,
  getCustomerSession,
  setSessionCookie,
} from '@/shared/lib/auth/session';

const patchSchema = z.object({
  nom: z.string().min(2).max(100).optional(),
  telephone: z.string().max(30).nullable().optional(),
  adressePreferee: z.string().max(300).nullable().optional(),
  villePreferee: z.string().max(100).nullable().optional(),
  avatarCouleur: z
    .enum(AVATAR_COULEURS.map((c) => c.id) as [string, ...string[]])
    .optional(),
});

function unauthorized() {
  return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
}

/** GET /api/compte/profil */
export async function GET() {
  const session = await getCustomerSession();
  if (!session?.id) return unauthorized();

  const profil = await customerProfileService.obtenirProfil(session.id);
  if (!profil) return NextResponse.json({ message: 'Compte introuvable' }, { status: 401 });

  return NextResponse.json({ profil });
}

/** PATCH /api/compte/profil */
export async function PATCH(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session?.id) return unauthorized();

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Données invalides' },
      { status: 400 },
    );
  }

  const profil = await customerProfileService.mettreAJourProfil(session.id, parsed.data);
  if (!profil) return NextResponse.json({ message: 'Compte introuvable' }, { status: 401 });

  const response = NextResponse.json({ profil, message: 'Profil mis à jour' });

  if (parsed.data.nom) {
    const token = createSessionToken({
      id: session.id,
      email: session.email,
      name: profil.nom,
      role: 'customer',
    });
    setSessionCookie(response, token);
  }

  return response;
}
