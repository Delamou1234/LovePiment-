import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { passwordResetService } from '@/modules/auth/services/password-reset.service';
import { passwordSchema } from '@/shared/lib/security/password-policy';
import { enforceRateLimit } from '@/shared/lib/security/enforce-rate-limit';

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{8}$/, 'Le code doit contenir 8 chiffres'),
  password: passwordSchema,
});

/** POST /api/auth/reset-password */
export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'authResetCode');
    if (limited) return limited;

    const body = await request.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Données invalides';
      return NextResponse.json({ message: msg }, { status: 400 });
    }

    const { email, code, password } = parsed.data;
    const result = await passwordResetService.reinitialiserMotDePasse(email, code, password);

    if (result === 'invalid') {
      return NextResponse.json(
        { message: 'Code invalide ou expiré. Recommencez la procédure.' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Mot de passe mis à jour. Vous pouvez vous connecter.',
    });
  } catch (error) {
    console.error('[POST /api/auth/reset-password]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
