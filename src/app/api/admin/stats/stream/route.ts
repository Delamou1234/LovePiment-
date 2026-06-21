import { adminStatsService } from '@/modules/admin/services/admin-stats.service';
import { requireAdmin } from '@/modules/admin/lib/require-admin';

/** GET /api/admin/stats/stream — statistiques dashboard en temps réel (SSE) */
export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let lastSnapshot = '';
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        if (closed) return;
        try {
          const stats = await adminStatsService.obtenirDashboard();
          const snapshot = JSON.stringify(stats);
          if (snapshot !== lastSnapshot) {
            lastSnapshot = snapshot;
            send({ type: 'update', stats, at: new Date().toISOString() });
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
