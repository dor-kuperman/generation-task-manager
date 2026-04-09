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

  const connect = useCallback(() => {
    if (!enabled) return;

    const source = new EventSource(url);
    sourceRef.current = source;
    setStatus('connecting');

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

    if (events.length > 0) {
      events.forEach((eventName) => source.addEventListener(eventName, handler));
    } else {
      source.onmessage = handler;
    }

    return () => {
      source.close();
      setStatus('closed');
    };
  }, [url, events, enabled]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  const clearLog = useCallback(() => setEventLog([]), []);

  return { status, lastEvent, eventLog, clearLog };
}
