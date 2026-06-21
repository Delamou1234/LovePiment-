import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSessionToken,
  isAuthConfigured,
  setSessionCookie,
} from '@/shared/lib/auth/session';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import { storeSettingsService } from '@/modules/admin/services/store-settings.service';
import { getSafeRedirect } from '@/shared/lib/auth-redirect';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Minimum 6 caractères'),
  nom: z.string().min(2).max(100),
  telephone: z.string().max(30).optional(),
  redirect: z.string().optional(),
  codeParrainage: z.string().max(40).optional(),
});

/** POST /api/auth/register — inscription client */
export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ message: 'AUTH_SECRET manquant' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Données invalides' },
        { status: 400 },
      );
    }

    const { email, password, nom, telephone, redirect, codeParrainage } = parsed.data;
    const existing = await customerAuthRepository.trouverParEmail(email);
    if (existing) {
      if (existing.googleId && !existing.passwordHash) {
        return NextResponse.json(
          { message: 'Ce compte utilise Google. Connectez-vous avec Google.' },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { message: 'Un compte existe déjà avec cet e-mail.' },
        { status: 409 },
      );
    }

    const customer = await customerAuthRepository.creer({
      email,
      password,
      nom,
      telephone,
    });

    if (codeParrainage?.trim()) {
      const flags = await storeSettingsService.getFeatureFlags();
      if (flags.parrainageActif) {
        try {
          await marketingService.lierParrain(customer.id, codeParrainage);
        } catch (parrainError) {
          console.warn('[POST /api/auth/register] parrainage:', parrainError);
        }
      }
    }

    const token = createSessionToken({
      id: customer.id,
      email: customer.email,
      name: customer.nom,
      role: 'customer',
    });

    const safeRedirect = getSafeRedirect(redirect, '/commande');
    const response = NextResponse.json({ ok: true, redirect: safeRedirect }, { status: 201 });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
