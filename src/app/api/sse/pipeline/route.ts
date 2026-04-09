import { NextRequest } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { isAdmin } from '@/lib/auth/rbac';
import { sseHub } from '@/lib/sse/emitter';
import { startCdcRelay } from '@/lib/sse/relay';
import { ForbiddenError, handleError } from '@/lib/errors';
import type { SSEEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!isAdmin(auth.userRole)) {
      throw new ForbiddenError('Access denied');
    }
  } catch (error) {
    return handleError(error);
  }

  // Ensure relay is running
  await startCdcRelay();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const handler = (event: SSEEvent) => {
        const data = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      sseHub.on('pipeline', handler);

      // 30s heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
        }
      }, 30000);

      // Send initial connection event
      const init = `event: connected\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`;
      controller.enqueue(encoder.encode(init));

      request.signal.addEventListener('abort', () => {
        sseHub.off('pipeline', handler);
        clearInterval(heartbeat);
        try { controller.close(); } catch { }
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
