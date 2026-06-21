import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/modules/messagerie/lib/chat-auth';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

type Params = Promise<{ id: string }>;

const messageSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE', 'DOCUMENT', 'VOICE']).default('TEXT'),
  contenu: z.string().max(4000).optional(),
  fichierUrl: z.string().optional(),
  fichierNom: z.string().max(255).optional(),
  fichierTaille: z.number().int().positive().optional(),
  dureeMs: z.number().int().positive().optional(),
});

/** POST /api/admin/messagerie/conversations/[id]/messages */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const message = await conversationService.envoyerMessage(id, {
    senderRole: 'VENDEUR',
    ...parsed.data,
  });

  return NextResponse.json({ message }, { status: 201 });
}
