import { NextRequest, NextResponse } from 'next/server';
import { commandesParTelephoneAgent } from '@/modules/agent/services/agent-data.service';
import {
  isAgentApiConfigured,
  reponseAgentNonAutorisee,
  verifierAgentApiAuth,
} from '@/shared/lib/agent-api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/agent/commandes?telephone=224625617377 */
export async function GET(request: NextRequest) {
  if (!isAgentApiConfigured()) {
    return NextResponse.json({ message: 'AGENT_API_SECRET non configuré.' }, { status: 503 });
  }
  if (!verifierAgentApiAuth(request)) {
    return reponseAgentNonAutorisee();
  }

  const telephone = request.nextUrl.searchParams.get('telephone');
  if (!telephone) {
    return NextResponse.json({ message: 'Paramètre telephone requis' }, { status: 400 });
  }

  const commandes = await commandesParTelephoneAgent(telephone, 5);
  return NextResponse.json({ commandes });
}
