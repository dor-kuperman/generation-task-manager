'use client';

import { useSSE } from '@/hooks/use-sse';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';

interface CdcEventData {
  event_id: number;
  table: string;
  op: string;
  row_id: string;
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  open: 'success',
  connecting: 'warning',
  error: 'danger',
  closed: 'default',
};

export function PipelineMonitor() {
  const { status, eventLog, clearLog } = useSSE<CdcEventData>({
    url: '/api/sse/pipeline',
    events: ['cdc_event', 'connected'],
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Connection Status</h2>
            <Badge variant={statusColors[status] ?? 'default'}>
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{eventLog.length}</p>
              <p className="text-sm text-gray-500">Events Received</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {eventLog.filter((e) => e.type === 'cdc_event').length}
              </p>
              <p className="text-sm text-gray-500">CDC Events</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {eventLog.length > 0
                  ? `${((Date.now() - eventLog[eventLog.length - 1].timestamp) / 1000).toFixed(0)}s`
                  : '-'}
              </p>
              <p className="text-sm text-gray-500">Since Last Event</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live Event Feed</h2>
            <button onClick={clearLog} className="text-sm text-gray-500 hover:text-gray-700">
              Clear
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {eventLog.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              Waiting for events... Create or update a task to see live CDC events.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...eventLog].reverse().map((entry, i) => (
                <div key={i} className="flex items-center gap-3 text-sm p-2 rounded bg-gray-50">
                  <Badge variant={entry.type === 'cdc_event' ? 'info' : 'default'}>
                    {entry.type}
                  </Badge>
                  <span className="font-mono text-xs text-gray-600 flex-1 truncate">
                    {JSON.stringify(entry.data)}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
