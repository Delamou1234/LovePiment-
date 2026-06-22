import { NextRequest, NextResponse } from 'next/server';
import {
  produitParSlugAgent,
  rechercherProduitsAgent,
} from '@/modules/agent/services/agent-data.service';
import {
  isAgentApiConfigured,
  reponseAgentNonAutorisee,
  verifierAgentApiAuth,
} from '@/shared/lib/agent-api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/agent/catalog?q=parfum&limit=10 */
export async function GET(request: NextRequest) {
  if (!isAgentApiConfigured()) {
    return NextResponse.json({ message: 'AGENT_API_SECRET non configuré.' }, { status: 503 });
  }
  if (!verifierAgentApiAuth(request)) {
    return reponseAgentNonAutorisee();
  }

  const q = request.nextUrl.searchParams.get('q') ?? undefined;
  const limit = Math.min(30, Number(request.nextUrl.searchParams.get('limit') ?? 12) || 12);

  const produits = await rechercherProduitsAgent(q, limit);
  return NextResponse.json({ produits, total: produits.length });
}
