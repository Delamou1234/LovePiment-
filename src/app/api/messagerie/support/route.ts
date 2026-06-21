import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConnectionError } from '@/shared/lib/db/errors';
import { resolveChatClientContext } from '@/modules/messagerie/lib/client-context';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

/** GET /api/messagerie/support — fil unique client ↔ équipe KabiShop */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveChatClientContext(request);
    if (!ctx) {
      return NextResponse.json({ message: 'Session requise' }, { status: 401 });
    }

    const enriched = await conversationService.enrichirContexteClient(ctx);
    const conversation = await conversationService.obtenirOuCreerSupport({
      clientSessionId: enriched.sessionId,
      clientUserId: enriched.userId,
      clientNom: enriched.nom,
      clientTelephone: enriched.telephone,
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('[GET /api/messagerie/support]', error);
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(
        { message: 'Base de données indisponible. Réessayez dans un instant.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
