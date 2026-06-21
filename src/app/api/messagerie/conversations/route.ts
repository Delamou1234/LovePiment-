import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientAccessFromRequest, resolveChatClientContext } from '@/modules/messagerie/lib/client-context';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

const createSchema = z.object({
  clientNom: z.string().min(1).max(80).optional(),
  clientTelephone: z.string().max(30).optional(),
  sujet: z.string().max(120).optional(),
  orderId: z.string().optional(),
  messageInitial: z.string().max(2000).optional(),
});

/** GET /api/messagerie/conversations — fil(s) support client */
export async function GET(request: NextRequest) {
  try {
    const access = await getClientAccessFromRequest(request);
    if (!access) {
      return NextResponse.json({ message: 'Session requise' }, { status: 401 });
    }

    const conversations = await conversationService.listerPourClient(
      access.sessionId,
      access.userId,
    );
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('[GET /api/messagerie/conversations]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

/** POST /api/messagerie/conversations — ouvre le fil support (unique) */
export async function POST(request: NextRequest) {
  const ctx = await resolveChatClientContext(request);
  if (!ctx) {
    return NextResponse.json({ message: 'Session requise' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);

  const enriched = await conversationService.enrichirContexteClient(ctx);
  const conversation = await conversationService.obtenirOuCreerSupport({
    clientSessionId: enriched.sessionId,
    clientUserId: enriched.userId,
    clientNom: parsed.success && parsed.data.clientNom?.trim()
      ? parsed.data.clientNom.trim()
      : enriched.nom,
    clientTelephone:
      (parsed.success ? parsed.data.clientTelephone : undefined) ?? enriched.telephone,
    messageInitial: parsed.success ? parsed.data.messageInitial : undefined,
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
