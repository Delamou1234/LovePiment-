import { NextResponse } from 'next/server';
import { adminAuthRepository } from '@/modules/auth/repository/admin-auth.repository';
import { getAdminSession } from '@/shared/lib/auth/session';

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin';
};

/** Vérifie la session admin + compte actif en base. */
export async function requireAdmin(): Promise<AdminSessionUser | null> {
  const session = await getAdminSession();
  if (!session) return null;

  const admin =
    (session.id ? await adminAuthRepository.trouverParId(session.id) : null) ??
    (await adminAuthRepository.trouverParEmail(session.email));
  if (!admin?.actif) return null;

  return {
    id: admin.id,
    email: admin.email,
    name: admin.nom,
    role: 'admin',
  };
}

export function adminUnauthorized() {
  return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
}
