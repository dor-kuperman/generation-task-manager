import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../logger';

type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

export function withLogging(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const requestId = crypto.randomUUID();
    const start = performance.now();
    const { method } = request;
    const path = request.nextUrl.pathname;

    let response: NextResponse;
    try {
      response = await handler(request, context);
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      logger.error({ requestId, method, path, duration, error }, 'Unhandled route error');
      throw error;
    }

    const duration = Math.round(performance.now() - start);
    const status = response.status;

    logger.info({ requestId, method, path, status, duration }, 'Request completed');

    response.headers.set('x-request-id', requestId);
    return response;
  };
}
