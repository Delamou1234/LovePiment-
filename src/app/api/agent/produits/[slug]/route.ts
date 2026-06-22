import { NextRequest, NextResponse } from 'next/server';
import { produitParSlugAgent } from '@/modules/agent/services/agent-data.service';
import {
  isAgentApiConfigured,
  reponseAgentNonAutorisee,
  verifierAgentApiAuth,
} from '@/shared/lib/agent-api-auth';

type Params = Promise<{ slug: string }>;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/agent/produits/[slug] */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  if (!isAgentApiConfigured()) {
    return NextResponse.json({ message: 'AGENT_API_SECRET non configuré.' }, { status: 503 });
  }
  if (!verifierAgentApiAuth(request)) {
    return reponseAgentNonAutorisee();
  }

  const { slug } = await params;
  const produit = await produitParSlugAgent(slug);
  if (!produit) {
    return NextResponse.json({ message: 'Produit introuvable' }, { status: 404 });
  }

  return NextResponse.json({ produit });
}
