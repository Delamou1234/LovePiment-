import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSessionToken,
  isAuthConfigured,
  setSessionCookie,
} from '@/shared/lib/auth/session';
import { courierAuthRepository } from '@/modules/livraison/repository/courier.repository';
import { assurerCompteClientPourLivreur } from '@/modules/livraison/services/courier-customer.service';
import { enforceRateLimit } from '@/shared/lib/security/enforce-rate-limit';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ message: 'AUTH_SECRET manquant' }, { status: 503 });
  }

  const limited = enforceRateLimit(request, 'authLogin');
  if (limited) return limited;

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

  const customer = await assurerCompteClientPourLivreur(courier.id);

  const token = createSessionToken({
    id: courier.id,
    email: courier.email,
    name: courier.nom,
    role: 'courier',
  });

  const response = NextResponse.json({ ok: true, redirect: '/livreur' });
  setSessionCookie(response, token, 'courier');
  if (customer) {
    const customerToken = createSessionToken({
      id: customer.id,
      email: customer.email,
      name: customer.nom,
      role: 'customer',
    });
    setSessionCookie(response, customerToken, 'customer');
  }
  return response;
}
