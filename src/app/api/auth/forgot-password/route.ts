import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { passwordResetService } from '@/modules/auth/services/password-reset.service';

const forgotSchema = z.object({
  email: z.string().email(),
});

/** POST /api/auth/forgot-password */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Adresse e-mail invalide' }, { status: 400 });
    }

    const result = await passwordResetService.demanderCode(parsed.data.email);
    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    console.error('[POST /api/auth/forgot-password]', error);
    const message =
      error instanceof Error && error.message.includes('envoyer')
        ? error.message
        : 'Erreur serveur';
    const status = message.includes('envoyer') ? 503 : 500;
    return NextResponse.json({ message }, { status });
  }
}
