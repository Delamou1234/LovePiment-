import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/modules/messagerie/lib/chat-auth';
import { assertAppelsActifs } from '@/modules/messagerie/lib/call-feature';
import { callSignalService } from '@/modules/messagerie/services/call-signal.service';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

type Params = Promise<{ id: string }>;

const signalSchema = z.object({
  type: z.enum(['OFFER', 'ANSWER', 'ICE', 'END', 'REJECT']),
  payload: z.unknown().optional(),
});

/** GET /api/admin/messagerie/conversations/[id]/call/signals */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;
  const conv = await conversationService.obtenirDetail(id, 'VENDEUR', { marquerLu: false });
  if (!conv) {
    return NextResponse.json({ message: 'Conversation introuvable' }, { status: 404 });
  }

  const since = request.nextUrl.searchParams.get('since') ?? new Date(0).toISOString();
  const signals = await callSignalService.listerDepuis(id, since);
  return NextResponse.json({ signals });
}

/** POST /api/admin/messagerie/conversations/[id]/call/signals */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;
  const conv = await conversationService.obtenirDetail(id, 'VENDEUR', { marquerLu: false });
  if (!conv) {
    return NextResponse.json({ message: 'Conversation introuvable' }, { status: 404 });
  }

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
    'VENDEUR',
    parsed.data.type,
    parsed.data.payload,
  );

  return NextResponse.json({ signal }, { status: 201 });
}
