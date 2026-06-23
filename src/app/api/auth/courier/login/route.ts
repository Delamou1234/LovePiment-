import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSessionToken,
  isAuthConfigured,
  setSessionCookie,
} from '@/shared/lib/auth/session';
import { courierAuthRepository } from '@/modules/livraison/repository/courier.repository';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ message: 'AUTH_SECRET manquant' }, { status: 503 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Identifiants invalides' }, { status: 400 });
  }

  const courier = await courierAuthRepository.verifierConnexion(
    parsed.data.email,
    parsed.data.password,
  );
  if (!courier) {
    return NextResponse.json({ message: 'E-mail ou mot de passe incorrect' }, { status: 401 });
  }

  const token = createSessionToken({
    id: courier.id,
    email: courier.email,
    name: courier.nom,
    role: 'courier',
  });

  const response = NextResponse.json({ ok: true, redirect: '/livreur' });
  setSessionCookie(response, token, 'courier');
  return response;
}
