import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { passwordResetService } from '@/modules/auth/services/password-reset.service';
import { enforceRateLimit } from '@/shared/lib/security/enforce-rate-limit';

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{8}$/, 'Le code doit contenir 8 chiffres'),
});

/** POST /api/auth/verify-reset-code */
export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'authResetCode');
    if (limited) return limited;

    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Données invalides';
      return NextResponse.json({ message: msg }, { status: 400 });
    }

    const result = await passwordResetService.verifierCode(
      parsed.data.email,
      parsed.data.code,
    );

    if (result === 'invalid') {
      return NextResponse.json(
        { message: 'Code incorrect ou expiré. Vérifiez votre e-mail ou demandez un nouveau code.' },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, message: 'Code vérifié. Choisissez votre nouveau mot de passe.' });
  } catch (error) {
    console.error('[POST /api/auth/verify-reset-code]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
