import { NextResponse } from 'next/server';
import { formaterInfosBoutiquePourPrompt } from '@/modules/ia/lib/boutique-context';
import {
  isAgentApiConfigured,
  reponseAgentNonAutorisee,
  verifierAgentApiAuth,
} from '@/shared/lib/agent-api-auth';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/agent/infos */
export async function GET(request: NextRequest) {
  if (!isAgentApiConfigured()) {
    return NextResponse.json({ message: 'AGENT_API_SECRET non configuré.' }, { status: 503 });
  }
  if (!verifierAgentApiAuth(request)) {
    return reponseAgentNonAutorisee();
  }

  return NextResponse.json({
    infos: formaterInfosBoutiquePourPrompt(),
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '224625617377',
  });
}
