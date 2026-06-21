import { NextResponse } from 'next/server';

const ADMIN_STUB = {
  email: 'admin@kabishop.local',
  name: 'Admin',
  role: 'admin' as const,
};

/** Accès admin ouvert — pas de page connexion requise. */
export async function requireAdmin() {
  return ADMIN_STUB;
}

export async function adminUnauthorized() {
  return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
}
