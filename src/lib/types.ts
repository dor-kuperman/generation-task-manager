export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserWithPassword extends User {
  password: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  created_by: string;
  due_date: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type CdcOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface CdcEvent {
  id: number;
  table_name: string;
  operation: CdcOperation;
  row_id: string;
  row_data: Record<string, unknown> | null;
  old_data: Record<string, unknown> | null;
  created_at: string;
  processed: boolean;
}

export interface CdcNotifyPayload {
  event_id: number;
  table: string;
  op: string;
  row_id: string;
}

export interface TaskDocument {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  created_by: string;
  due_date: string | null;
  tags: string[];
  is_overdue: boolean;
  days_until_due: number | null;
  created_at: string;
  updated_at: string;
}

export interface SearchResult<T> {
  hits: Array<{
    source: T;
    score: number;
    highlight?: Record<string, string[]>;
  }>;
  total: number;
}

export interface PipelineMetrics {
  processed_count: number;
  error_count: number;
  last_event_at: string | null;
  lag: number;
  status: 'running' | 'stopped' | 'error';
}

export type Permission =
  | 'tasks:create'
  | 'tasks:read'
  | 'tasks:update'
  | 'tasks:delete'
  | 'tasks:read_all'
  | 'users:manage'
  | 'pipeline:view';

export interface JWTPayload {
  sub: string;
  role: UserRole;
  email: string;
}

export interface SSEEvent {
  type: string;
  data: unknown;
}
