import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockQuery, mockConnect, mockEnd, mockOn } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockConnect: vi.fn(),
  mockEnd: vi.fn(),
  mockOn: vi.fn(),
}));

vi.mock('pg', () => {
  return {
    Client: class MockClient {
      query = mockQuery;
      connect = mockConnect;
      end = mockEnd;
      on = mockOn;
    },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { CdcListener } from '@/lib/cdc/listener';

describe('CDC Pipeline', () => {
  let listener: CdcListener;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockQuery.mockResolvedValue({ rows: [] });
    listener = new CdcListener('postgres://mock:5432/test');
  });

  describe('start / stop', () => {
    it('connects and listens on the cdc channel', async () => {
      await listener.start();

      expect(mockConnect).toHaveBeenCalledOnce();
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('LISTEN'));
    });

    it('stops cleanly', async () => {
      await listener.start();
      await listener.stop();

      expect(mockEnd).toHaveBeenCalledOnce();
    });
  });

  describe('processBacklog', () => {
    it('returns unprocessed CDC events', async () => {
      const mockEvents = [
        { id: 1, table_name: 'tasks', operation: 'INSERT', row_id: 't-1', processed: false },
        { id: 2, table_name: 'tasks', operation: 'UPDATE', row_id: 't-2', processed: false },
      ];

      // LISTEN query, then processBacklog SELECT
      mockQuery
        .mockResolvedValueOnce({ rows: [] })           // LISTEN
        .mockResolvedValueOnce({ rows: mockEvents });   // processBacklog

      await listener.start();

      const backlogCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('cdc_events'),
      );
      expect(backlogCall).toBeDefined();
      expect(backlogCall![0]).toContain('processed = FALSE');
    });

    it('returns empty array when client is not connected', async () => {
      const result = await listener.processBacklog();
      expect(result).toEqual([]);
    });
  });

  describe('markProcessed', () => {
    it('calls UPDATE with correct event ID', async () => {
      await listener.start();
      mockQuery.mockClear();

      mockQuery.mockResolvedValueOnce({ rows: [] });
      await listener.markProcessed(42);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cdc_events SET processed = TRUE'),
        [42],
      );
    });
  });

  describe('fetchEvent', () => {
    it('returns event by ID', async () => {
      const mockEvent = {
        id: 5,
        table_name: 'tasks',
        operation: 'INSERT',
        row_id: 't-5',
        row_data: { title: 'Test' },
        old_data: null,
        created_at: '2024-01-01T00:00:00Z',
        processed: false,
      };

      await listener.start();
      mockQuery.mockClear();

      mockQuery.mockResolvedValueOnce({ rows: [mockEvent] });
      const result = await listener.fetchEvent(5);

      expect(result).toEqual(mockEvent);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM cdc_events WHERE id = $1'),
        [5],
      );
    });

    it('returns null when client is not connected', async () => {
      const result = await listener.fetchEvent(1);
      expect(result).toBeNull();
    });
  });
});
