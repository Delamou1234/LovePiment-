import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientAccessFromRequest } from '@/modules/messagerie/lib/client-context';
import { assertAppelsActifs } from '@/modules/messagerie/lib/call-feature';
import { callSignalService } from '@/modules/messagerie/services/call-signal.service';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

type Params = Promise<{ id: string }>;

const signalSchema = z.object({
  type: z.enum(['OFFER', 'ANSWER', 'ICE', 'END', 'REJECT']),
  payload: z.unknown().optional(),
});

async function assertAccess(request: NextRequest, conversationId: string) {
  const access = await getClientAccessFromRequest(request);
  if (!access) return { error: NextResponse.json({ message: 'Session requise' }, { status: 401 }) };

  const allowed = await conversationService.peutAccederClient(
    conversationId,
    access.sessionId,
    access.userId,
  );
  if (!allowed) {
    return { error: NextResponse.json({ message: 'Conversation introuvable' }, { status: 404 }) };
  }
  return { access };
}

/** GET /api/messagerie/conversations/[id]/call/signals */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const check = await assertAccess(request, id);
  if ('error' in check && check.error) return check.error;

  const since = request.nextUrl.searchParams.get('since') ?? new Date(0).toISOString();
  const signals = await callSignalService.listerDepuis(id, since);
  return NextResponse.json({ signals });
}

/** POST /api/messagerie/conversations/[id]/call/signals */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const check = await assertAccess(request, id);
  if ('error' in check && check.error) return check.error;

  const body = await request.json();
  const parsed = signalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const callCheck = await assertAppelsActifs();
  if (!callCheck.ok && parsed.data.type !== 'END' && parsed.data.type !== 'REJECT') {
    return NextResponse.json({ message: callCheck.message }, { status: 403 });
  }

  if (parsed.data.type === 'END' || parsed.data.type === 'REJECT') {
    await callSignalService.terminer(id);
  }

  const signal = await callSignalService.envoyer(
    id,
    'CLIENT',
    parsed.data.type,
    parsed.data.payload,
  );

  return NextResponse.json({ signal }, { status: 201 });
}
