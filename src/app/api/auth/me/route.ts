import { NextResponse } from 'next/server';
import { adminAuthRepository } from '@/modules/auth/repository/admin-auth.repository';
import { getSession } from '@/shared/lib/auth/session';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';

/** GET /api/auth/me — session + profil client depuis la base */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  if (session.role === 'admin') {
    const admin =
      (session.id ? await adminAuthRepository.trouverParId(session.id) : null) ??
      (await adminAuthRepository.trouverParEmail(session.email));
    if (!admin?.actif) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.nom,
        role: 'admin' as const,
      },
    });
  }

  if (!session.id) {
    return NextResponse.json({ user: session });
  }

  const customer = await customerAuthRepository.trouverParId(session.id);
  if (!customer) {
    return NextResponse.json({ user: session });
  }

  const derniereCommande = await customerAuthRepository.trouverDerniereCommande(customer.id);

  return NextResponse.json({
    user: {
      id: customer.id,
      email: customer.email,
      name: customer.nom,
      role: 'customer' as const,
      telephone: customer.telephone,
      avatarUrl: customer.avatarUrl,
      viaGoogle: Boolean(customer.googleId),
      adressePreferee: customer.adressePreferee,
      villePreferee: customer.villePreferee,
      derniereAdresse:
        customer.adressePreferee ?? derniereCommande?.clientAdresse ?? null,
      derniereVille: customer.villePreferee ?? derniereCommande?.clientVille ?? null,
    },
  });
}
