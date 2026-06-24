import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { customerProfileService } from '@/modules/compte/services/customer-profile.service';
import { getCustomerSession } from '@/shared/lib/auth/session';

const schema = z.object({
  ancienMotDePasse: z.string().min(1),
  nouveauMotDePasse: z.string().min(6, 'Minimum 6 caractères'),
  confirmation: z.string().min(6),
});

/** POST /api/compte/mot-de-passe */
export async function POST(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Données invalides' },
      { status: 400 },
    );
  }

  const { ancienMotDePasse, nouveauMotDePasse, confirmation } = parsed.data;
  if (nouveauMotDePasse !== confirmation) {
    return NextResponse.json({ message: 'Les mots de passe ne correspondent pas' }, { status: 400 });
  }

  const result = await customerProfileService.changerMotDePasse(
    session.id,
    ancienMotDePasse,
    nouveauMotDePasse,
  );

  if (result === 'no_password') {
    return NextResponse.json(
      { message: 'Aucun mot de passe défini. Utilisez « Mot de passe oublié » pour en créer un.' },
      { status: 400 },
    );
  }
  if (result === 'invalid') {
    return NextResponse.json({ message: 'Mot de passe actuel incorrect' }, { status: 401 });
  }

  return NextResponse.json({ message: 'Mot de passe mis à jour' });
}
