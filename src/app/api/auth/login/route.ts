import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSessionToken,
  isAuthConfigured,
  setSessionCookie,
} from '@/shared/lib/auth/session';
import { adminAuthRepository } from '@/modules/auth/repository/admin-auth.repository';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { courierAuthRepository } from '@/modules/livraison/repository/courier.repository';
import { getPostLoginRedirect } from '@/shared/lib/auth-redirect';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  redirect: z.string().optional(),
});

/** POST /api/auth/login — client, admin ou livreur (détection automatique). */
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

    const { email, password, redirect } = parsed.data;

    const customer = await customerAuthRepository.verifierConnexion(email, password);
    if (customer) {
      const token = createSessionToken({
        id: customer.id,
        email: customer.email,
        name: customer.nom,
        role: 'customer',
      });
      const safeRedirect = getPostLoginRedirect('customer', redirect);
      const response = NextResponse.json({ ok: true, redirect: safeRedirect, role: 'customer' });
      setSessionCookie(response, token, 'customer');
      return response;
    }

    const admin = await adminAuthRepository.verifierConnexion(email, password);
    if (admin) {
      const token = createSessionToken({
        id: admin.id,
        email: admin.email,
        name: admin.nom,
        role: 'admin',
      });
      const safeRedirect = getPostLoginRedirect('admin', redirect);
      const response = NextResponse.json({ ok: true, redirect: safeRedirect, role: 'admin' });
      setSessionCookie(response, token, 'admin');
      return response;
    }

    const courier = await courierAuthRepository.verifierConnexion(email, password);
    if (courier) {
      const token = createSessionToken({
        id: courier.id,
        email: courier.email,
        name: courier.nom,
        role: 'courier',
      });
      const safeRedirect = getPostLoginRedirect('courier', redirect);
      const response = NextResponse.json({ ok: true, redirect: safeRedirect, role: 'courier' });
      setSessionCookie(response, token, 'courier');
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
  } catch (error) {
    console.error('[POST /api/auth/login]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
