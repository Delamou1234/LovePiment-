import { NextRequest, NextResponse } from 'next/server';
import { getClientAccessFromRequest } from '@/modules/messagerie/lib/client-context';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

type Params = Promise<{ id: string }>;

/** GET /api/messagerie/conversations/[id] */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const access = await getClientAccessFromRequest(request);
  if (!access) {
    return NextResponse.json({ message: 'Session requise' }, { status: 401 });
  }

  const { id } = await params;
  const allowed = await conversationService.peutAccederClient(
    id,
    access.sessionId,
    access.userId,
  );
  if (!allowed) {
    return NextResponse.json({ message: 'Conversation introuvable' }, { status: 404 });
  }

  const conversation = await conversationService.obtenirDetail(id, 'CLIENT');
  return NextResponse.json({ conversation });
}
