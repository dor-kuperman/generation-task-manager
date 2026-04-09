import type { CdcEvent, TaskDocument, CdcOperation } from '../types';

interface TransformResult {
  action: 'index' | 'delete';
  id: string;
  document?: TaskDocument;
}

function computeOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'done' || status === 'archived') return false;
  return new Date(dueDate) < new Date();
}

function computeDaysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function transformTaskRow(row: Record<string, unknown>): TaskDocument {
  const dueDate = row.due_date as string | null;
  const status = row.status as string;

  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? null,
    status: status as TaskDocument['status'],
    priority: row.priority as TaskDocument['priority'],
    assignee_id: (row.assignee_id as string) ?? null,
    created_by: row.created_by as string,
    due_date: dueDate,
    tags: (row.tags as string[]) ?? [],
    is_overdue: computeOverdue(dueDate, status),
    days_until_due: computeDaysUntilDue(dueDate),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

const transformers: Record<string, (event: CdcEvent) => TransformResult | null> = {
  tasks: (event: CdcEvent): TransformResult | null => {
    if (event.operation === 'DELETE') {
      return { action: 'delete', id: event.row_id };
    }

    if (!event.row_data) return null;

    return {
      action: 'index',
      id: event.row_id,
      document: transformTaskRow(event.row_data),
    };
  },
};

export function transformEvent(event: CdcEvent): TransformResult | null {
  const transformer = transformers[event.table_name];
  if (!transformer) return null;
  return transformer(event);
}

export { computeOverdue, computeDaysUntilDue, transformTaskRow };
export type { TransformResult };
