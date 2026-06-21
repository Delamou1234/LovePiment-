import { NextRequest, NextResponse } from 'next/server';
import { dailyDigestService } from '@/modules/admin/services/daily-digest.service';
import { getCronSecret } from '@/shared/lib/email/env';
import { isEmailConfigured } from '@/shared/lib/email/mailer';

function autoriserCron(request: NextRequest): boolean {
  const secret = getCronSecret();
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

/**
 * GET /api/cron/daily-digest
 * Déclenché automatiquement chaque soir (voir vercel.json).
 * Auth : Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  if (!autoriserCron(request)) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        sent: false,
        message:
          'E-mail non configuré. Définissez SMTP_HOST, SMTP_USER, SMTP_PASS et ADMIN_EMAIL.',
      },
      { status: 503 },
    );
  }

  const result = await dailyDigestService.envoyer();

  if (!result.sent) {
    return NextResponse.json(
      { sent: false, to: result.to, error: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json({
    sent: true,
    to: result.to,
    message: 'Rapport quotidien envoyé',
  });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
