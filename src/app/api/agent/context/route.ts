import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { construireContexteAgent } from '@/modules/agent/services/agent-data.service';
import {
  isAgentApiConfigured,
  reponseAgentNonAutorisee,
  verifierAgentApiAuth,
} from '@/shared/lib/agent-api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  message: z.string().max(4000).default(''),
  telephone: z.string().max(30).optional().nullable(),
});

/**
 * POST /api/agent/context
 * Contexte boutique + produits + commandes pour l'agent WhatsApp (n8n).
 * Auth : Authorization: Bearer AGENT_API_SECRET
 */
export async function POST(request: NextRequest) {
  if (!isAgentApiConfigured()) {
    return NextResponse.json(
      { message: 'AGENT_API_SECRET non configuré sur le serveur KabiShop.' },
      { status: 503 },
    );
  }

  if (!verifierAgentApiAuth(request)) {
    return reponseAgentNonAutorisee();
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Corps invalide' }, { status: 400 });
    }

    const data = await construireContexteAgent(parsed.data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[POST /api/agent/context]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
