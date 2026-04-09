import { NextRequest } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { isAdmin } from '@/lib/auth/rbac';
import { sseHub } from '@/lib/sse/emitter';
import { startCdcRelay } from '@/lib/sse/relay';
import { getTaskById } from '@/lib/db/queries/tasks';
import { handleError } from '@/lib/errors';
import type { SSEEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let auth;
  try {
    auth = await authenticate(request);
  } catch (error) {
    return handleError(error);
  }

  await startCdcRelay();

  const userId = auth.userId;
  const userIsAdmin = isAdmin(auth.userRole);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const handler = async (event: SSEEvent) => {
        // Filter: only emit task events the user owns (or all for admins)
        if (!userIsAdmin && event.type === 'task_change') {
          const eventData = event.data as { op: string; row_id: string };
          // For DELETE events, the task is gone — skip filtering (client will handle)
          if (eventData.op !== 'DELETE') {
            const task = await getTaskById(eventData.row_id);
            if (task && task.created_by !== userId && task.assignee_id !== userId) {
              return; // Not this user's task
            }
          }
        }

        try {
          const data = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          // stream closed
        }
      };

      sseHub.on('tasks', handler);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          // stream closed
        }
      }, 30000);

      const init = `event: connected\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`;
      controller.enqueue(encoder.encode(init));

      request.signal.addEventListener('abort', () => {
        sseHub.off('tasks', handler);
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* already closed */ }
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
