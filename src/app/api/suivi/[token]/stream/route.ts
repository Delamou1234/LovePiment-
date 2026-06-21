import { trackingService } from '@/modules/livraison/services/tracking.service';

type Params = Promise<{ token: string }>;

/** GET /api/suivi/[token]/stream — mises à jour en temps réel (SSE) */
export async function GET(request: Request, { params }: { params: Params }) {
  const { token } = await params;

  const encoder = new TextEncoder();
  let lastUpdatedAt = '';
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        if (closed) return;
        try {
          const suivi = await trackingService.obtenirSuiviParToken(token);
          if (!suivi) {
            send({ error: 'not_found' });
            controller.close();
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
      const interval = setInterval(poll, 5000);

      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(interval);
        controller.close();
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
