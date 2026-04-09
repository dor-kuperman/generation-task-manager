import { describe, it, expect } from 'vitest';
import { transformEvent, computeOverdue, computeDaysUntilDue, transformTaskRow } from '@/lib/cdc/transformer';
import type { CdcEvent } from '@/lib/types';

describe('CDC Transformer', () => {
  const baseRow = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Task',
    description: 'A test description',
    status: 'todo',
    priority: 'medium',
    assignee_id: null,
    created_by: '123e4567-e89b-12d3-a456-426614174001',
    due_date: null,
    tags: ['test'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  describe('transformEvent', () => {
    it('transforms INSERT event to index action', () => {
      const event: CdcEvent = {
        id: 1,
        table_name: 'tasks',
        operation: 'INSERT',
        row_id: baseRow.id,
        row_data: baseRow,
        old_data: null,
        created_at: '2024-01-01T00:00:00Z',
        processed: false,
      };

      const result = transformEvent(event);
      expect(result).not.toBeNull();
      expect(result!.action).toBe('index');
      expect(result!.id).toBe(baseRow.id);
      expect(result!.document).toBeDefined();
      expect(result!.document!.title).toBe('Test Task');
    });

    it('transforms UPDATE event to index action', () => {
      const event: CdcEvent = {
        id: 2,
        table_name: 'tasks',
        operation: 'UPDATE',
        row_id: baseRow.id,
        row_data: { ...baseRow, title: 'Updated Task' },
        old_data: baseRow,
        created_at: '2024-01-01T00:00:00Z',
        processed: false,
      };

      const result = transformEvent(event);
      expect(result!.action).toBe('index');
      expect(result!.document!.title).toBe('Updated Task');
    });

    it('transforms DELETE event to delete action', () => {
      const event: CdcEvent = {
        id: 3,
        table_name: 'tasks',
        operation: 'DELETE',
        row_id: baseRow.id,
        row_data: null,
        old_data: baseRow,
        created_at: '2024-01-01T00:00:00Z',
        processed: false,
      };

      const result = transformEvent(event);
      expect(result!.action).toBe('delete');
      expect(result!.id).toBe(baseRow.id);
      expect(result!.document).toBeUndefined();
    });

    it('returns null for unknown table', () => {
      const event: CdcEvent = {
        id: 4,
        table_name: 'unknown_table',
        operation: 'INSERT',
        row_id: baseRow.id,
        row_data: baseRow,
        old_data: null,
        created_at: '2024-01-01T00:00:00Z',
        processed: false,
      };

      expect(transformEvent(event)).toBeNull();
    });
  });

  describe('computeOverdue', () => {
    it('returns false when no due date', () => {
      expect(computeOverdue(null, 'todo')).toBe(false);
    });

    it('returns false when task is done', () => {
      expect(computeOverdue('2020-01-01', 'done')).toBe(false);
    });

    it('returns false when task is archived', () => {
      expect(computeOverdue('2020-01-01', 'archived')).toBe(false);
    });

    it('returns true when due date is in the past and task is active', () => {
      expect(computeOverdue('2020-01-01', 'todo')).toBe(true);
    });

    it('returns false when due date is in the future', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(computeOverdue(future.toISOString(), 'in_progress')).toBe(false);
    });
  });

  describe('computeDaysUntilDue', () => {
    it('returns null when no due date', () => {
      expect(computeDaysUntilDue(null)).toBeNull();
    });

    it('returns negative number for past dates', () => {
      expect(computeDaysUntilDue('2020-01-01')).toBeLessThan(0);
    });

    it('returns positive number for future dates', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(computeDaysUntilDue(future.toISOString())).toBeGreaterThan(0);
    });
  });

  describe('transformTaskRow', () => {
    it('maps all fields correctly', () => {
      const doc = transformTaskRow(baseRow);
      expect(doc.id).toBe(baseRow.id);
      expect(doc.title).toBe('Test Task');
      expect(doc.status).toBe('todo');
      expect(doc.priority).toBe('medium');
      expect(doc.tags).toEqual(['test']);
      expect(doc.is_overdue).toBe(false);
      expect(doc.days_until_due).toBeNull();
    });

    it('computes is_overdue for overdue tasks', () => {
      const doc = transformTaskRow({ ...baseRow, due_date: '2020-01-01' });
      expect(doc.is_overdue).toBe(true);
    });
  });
});
