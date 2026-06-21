import { trackingService } from '@/modules/livraison/services/tracking.service';
import { closeSseStream, createSseSender, bindSseLifecycle, getSseMaxMs } from '@/shared/lib/sse-stream';

type Params = Promise<{ token: string }>;

/** GET /api/suivi/[token]/stream — mises à jour en temps réel (SSE) */
export async function GET(request: Request, { params }: { params: Params }) {
  const { token } = await params;

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
          const suivi = await trackingService.obtenirSuiviParToken(token);
          if (!suivi) {
            send({ error: 'not_found' });
            if (interval) clearInterval(interval);
            closeSseStream(controller, () => closed, shutdown);
            return;
          }
          if (suivi.updatedAt !== lastUpdatedAt) {
            lastUpdatedAt = suivi.updatedAt;
            send({ type: 'update', suivi });
          } else {
            send({ type: 'heartbeat', at: new Date().toISOString() });
          }
        } catch {
          send({ error: 'server_error' });
        }
      };

      await poll();
      interval = setInterval(poll, 10_000);

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
