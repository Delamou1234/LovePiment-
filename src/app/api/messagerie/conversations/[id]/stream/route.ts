import { NextRequest } from 'next/server';
import { getClientAccessFromRequest } from '@/modules/messagerie/lib/client-context';
import { conversationService } from '@/modules/messagerie/services/conversation.service';
import { closeSseStream, createSseSender, bindSseLifecycle, getSseMaxMs } from '@/shared/lib/sse-stream';

type Params = Promise<{ id: string }>;

const POLL_MS = 8_000;

/** GET /api/messagerie/conversations/[id]/stream — SSE léger (métadonnées uniquement). */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const access = await getClientAccessFromRequest(request);
  const { id } = await params;

  if (!access) {
    return new Response('Unauthorized', { status: 401 });
  }

  const allowed = await conversationService.peutAccederClient(
    id,
    access.sessionId,
    access.userId,
  );
  if (!allowed) {
    return new Response('Not found', { status: 404 });
  }

  const encoder = new TextEncoder();
  let lastUpdatedAt = '';
  let closed = false;
  let interval: ReturnType<typeof setInterval> | undefined;

  const shutdown = () => {
    closed = true;
  };

  const stream = new ReadableStream({
    async start(controller) {
      const send = createSseSender(controller, encoder, () => closed, shutdown);

      const poll = async () => {
        if (closed) return;
        try {
          const indicator = await conversationService.obtenirIndicateurMaj(id);
          if (!indicator) {
            send({ error: 'not_found' });
            if (interval) clearInterval(interval);
            closeSseStream(controller, () => closed, shutdown);
            return;
          }
          if (indicator.updatedAt !== lastUpdatedAt) {
            lastUpdatedAt = indicator.updatedAt;
            send({ type: 'update', updatedAt: indicator.updatedAt });
          } else {
            send({ type: 'heartbeat', at: new Date().toISOString() });
          }
        } catch {
          send({ error: 'server_error' });
        }
      };

      await poll();
      interval = setInterval(poll, POLL_MS);

      const stop = () => {
        if (interval) clearInterval(interval);
        closeSseStream(controller, () => closed, shutdown);
      };

      bindSseLifecycle(request, getSseMaxMs(), stop);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
