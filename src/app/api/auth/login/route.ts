import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSessionToken,
  isAuthConfigured,
  setSessionCookie,
} from '@/shared/lib/auth/session';
import { adminAuthRepository } from '@/modules/auth/repository/admin-auth.repository';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { getSafeRedirect, isAdminRedirect } from '@/shared/lib/auth-redirect';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  redirect: z.string().optional(),
  mode: z.enum(['admin', 'customer']).optional(),
});

/** POST /api/auth/login */
export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { message: 'AUTH_SECRET manquant dans .env.local' },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'E-mail ou mot de passe invalide' }, { status: 400 });
    }

    const { email, password, redirect, mode } = parsed.data;
    const isAdmin =
      mode === 'admin' || (mode !== 'customer' && isAdminRedirect(redirect));

    if (isAdmin) {
      const admin = await adminAuthRepository.verifierConnexion(email, password);
      if (!admin) {
        return NextResponse.json({ message: 'E-mail ou mot de passe incorrect' }, { status: 401 });
      }

      const token = createSessionToken({
        id: admin.id,
        email: admin.email,
        name: admin.nom,
        role: 'admin',
      });

      const safeRedirect = getSafeRedirect(redirect, '/admin');
      const response = NextResponse.json({ ok: true, redirect: safeRedirect, role: 'admin' });
      setSessionCookie(response, token);
      return response;
    }

    const customer = await customerAuthRepository.verifierConnexion(email, password);
    if (!customer) {
      // Compte admin saisi sur la page client (URL sans redirect=/admin)
      const admin = await adminAuthRepository.verifierConnexion(email, password);
      if (admin) {
        const token = createSessionToken({
          id: admin.id,
          email: admin.email,
          name: admin.nom,
          role: 'admin',
        });
        const safeRedirect = getSafeRedirect(redirect, '/admin');
        const response = NextResponse.json({ ok: true, redirect: safeRedirect, role: 'admin' });
        setSessionCookie(response, token);
        return response;
      }

      const existing = await customerAuthRepository.trouverParEmail(email);
      if (existing?.googleId && !existing.passwordHash) {
        return NextResponse.json(
          { message: 'Ce compte utilise Google. Connectez-vous avec Google.' },
          { status: 401 },
        );
      }
      return NextResponse.json({ message: 'E-mail ou mot de passe incorrect' }, { status: 401 });
    }

    const token = createSessionToken({
      id: customer.id,
      email: customer.email,
      name: customer.nom,
      role: 'customer',
    });

    const safeRedirect = getSafeRedirect(redirect, '/commande');
    const response = NextResponse.json({ ok: true, redirect: safeRedirect, role: 'customer' });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('[POST /api/auth/login]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
