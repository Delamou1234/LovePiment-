import { requireAdmin } from '@/modules/messagerie/lib/chat-auth';
import { conversationService } from '@/modules/messagerie/services/conversation.service';
import { closeSseStream, createSseSender, bindSseLifecycle, getSseMaxMs } from '@/shared/lib/sse-stream';

type Params = Promise<{ id: string }>;

const POLL_MS = 8_000;

/** GET /api/admin/messagerie/conversations/[id]/stream — SSE admin (métadonnées uniquement). */
export async function GET(request: Request, { params }: { params: Params }) {
  const user = await requireAdmin();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;
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

      bindSseLifecycle(request, getSseMaxMs(), () => {
        if (interval) clearInterval(interval);
        closeSseStream(controller, () => closed, shutdown);
      });
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
