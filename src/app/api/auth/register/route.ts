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
import { getSafeRedirectForCustomer } from '@/shared/lib/auth-redirect';
import { passwordSchema } from '@/shared/lib/security/password-policy';
import { enforceRateLimit } from '@/shared/lib/security/enforce-rate-limit';
import { construireUtilisateurClientAuth } from '@/modules/auth/services/auth-me.service';

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
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
    const limited = enforceRateLimit(request, 'authRegister');
    if (limited) return limited;

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
          {
            message:
              'Un compte existe déjà avec cet e-mail. Utilisez « Mot de passe oublié » pour définir un mot de passe.',
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        {
          message:
            'Impossible de créer le compte. Si vous êtes déjà inscrite, connectez-vous ou utilisez « Mot de passe oublié ».',
        },
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

    const safeRedirect = getSafeRedirectForCustomer(redirect, '/compte');
    const user = await construireUtilisateurClientAuth(customer.id);
    const response = NextResponse.json(
      { ok: true, redirect: safeRedirect, role: 'customer', user },
      { status: 201 },
    );
    setSessionCookie(response, token, 'customer');
    return response;
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
