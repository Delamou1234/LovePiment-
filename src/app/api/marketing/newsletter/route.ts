import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { newsletterService } from '@/modules/marketing/services/newsletter.service';
import { enforceRateLimit } from '@/shared/lib/security/enforce-rate-limit';

/** GET /api/marketing/newsletter — configuration publique de la bannière */
export async function GET() {
  try {
    const config = await newsletterService.getPublicConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('[GET /api/marketing/newsletter]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

const subscribeSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  source: z.string().max(50).optional(),
});

/** POST /api/marketing/newsletter — inscription newsletter */
export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'newsletter');
    if (limited) return limited;

    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Données invalides' },
        { status: 400 },
      );
    }

    const result = await newsletterService.subscribe(parsed.data.email, parsed.data.source);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    const status = message.includes('invalide') ? 400 : 500;
    if (status === 500) console.error('[POST /api/marketing/newsletter]', error);
    return NextResponse.json({ message }, { status });
  }
}
