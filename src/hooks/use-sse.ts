'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type ConnectionStatus = 'connecting' | 'open' | 'error' | 'closed';

interface UseSSEOptions {
  url: string;
  events?: string[];
  enabled?: boolean;
}

export function useSSE<T = unknown>({ url, events = [], enabled = true }: UseSSEOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('closed');
  const [lastEvent, setLastEvent] = useState<{ type: string; data: T } | null>(null);
  const [eventLog, setEventLog] = useState<Array<{ type: string; data: T; timestamp: number }>>([]);
  const sourceRef = useRef<EventSource | null>(null);

  const eventsKey = events.join(',');

  useEffect(() => {
    if (!enabled) return;

    const eventNames = eventsKey.split(',').filter(Boolean);
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onopen = () => setStatus('open');
    source.onerror = () => setStatus('error');

    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as T;
        const entry = { type: event.type, data, timestamp: Date.now() };
        setLastEvent({ type: event.type, data });
        setEventLog((prev) => [...prev.slice(-99), entry]);
      } catch {
        // skip malformed events
      }
    };

    if (eventNames.length > 0) {
      eventNames.forEach((name) => source.addEventListener(name, handler));
    } else {
      source.onmessage = handler;
    }

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [url, enabled, eventsKey]);

  const clearLog = useCallback(() => setEventLog([]), []);

  return { status, lastEvent, eventLog, clearLog };
}
