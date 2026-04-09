import { EventEmitter } from 'events';
import type { SSEEvent } from '../types';

class SSEHub extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  broadcast(channel: string, event: SSEEvent): void {
    this.emit(channel, event);
  }
}

// Singleton — shared across all SSE route handlers in the same Next.js process
export const sseHub = new SSEHub();
