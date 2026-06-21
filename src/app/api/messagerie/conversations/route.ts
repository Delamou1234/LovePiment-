import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientSessionFromRequest } from '@/modules/messagerie/lib/chat-auth';
import { conversationService } from '@/modules/messagerie/services/conversation.service';
import { getCustomerSession } from '@/shared/lib/auth/session';

const createSchema = z.object({
  clientNom: z.string().min(1).max(80),
  clientTelephone: z.string().max(30).optional(),
  sujet: z.string().max(120).optional(),
  orderId: z.string().optional(),
  messageInitial: z.string().max(2000).optional(),
});

/** GET /api/messagerie/conversations — historique client */
export async function GET(request: NextRequest) {
  try {
    const sessionId = getClientSessionFromRequest(request);
    if (!sessionId) {
      return NextResponse.json({ message: 'Session requise' }, { status: 401 });
    }

    const conversations = await conversationService.listerPourClient(sessionId);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('[GET /api/messagerie/conversations]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

/** POST /api/messagerie/conversations — nouvelle conversation */
export async function POST(request: NextRequest) {
  const sessionId = getClientSessionFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ message: 'Session requise' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const customer = await getCustomerSession();

  const conversation = await conversationService.creerConversation({
    clientSessionId: sessionId,
    clientUserId: customer?.id,
    ...parsed.data,
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
