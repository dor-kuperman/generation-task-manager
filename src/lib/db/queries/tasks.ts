import { getPool } from '../pool';
import type { Task, TaskStatus, TaskPriority } from '../../types';

interface ListTasksOptions {
  userId: string;
  isAdmin: boolean;
  status?: TaskStatus;
  priority?: TaskPriority;
  limit?: number;
  offset?: number;
}

export async function listTasks(opts: ListTasksOptions): Promise<{ tasks: Task[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (!opts.isAdmin) {
    conditions.push(`(created_by = $${paramIndex} OR assignee_id = $${paramIndex})`);
    params.push(opts.userId);
    paramIndex++;
  }

  if (opts.status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(opts.status);
    paramIndex++;
  }

  if (opts.priority) {
    conditions.push(`priority = $${paramIndex}`);
    params.push(opts.priority);
    paramIndex++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;

  const countQuery = `SELECT COUNT(*) as total FROM tasks ${where}`;
  const dataQuery = `SELECT * FROM tasks ${where} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

  const [countResult, dataResult] = await Promise.all([
    getPool().query(countQuery, params),
    getPool().query<Task>(dataQuery, [...params, limit, offset]),
  ]);

  return {
    tasks: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
}

export async function getTaskById(id: string): Promise<Task | null> {
  const { rows } = await getPool().query<Task>(
    'SELECT * FROM tasks WHERE id = $1',
    [id],
  );
  return rows[0] ?? null;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  created_by: string;
  due_date?: string;
  tags?: string[];
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { rows } = await getPool().query<Task>(
    `INSERT INTO tasks (title, description, status, priority, assignee_id, created_by, due_date, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.title,
      input.description ?? null,
      input.status ?? 'todo',
      input.priority ?? 'medium',
      input.assignee_id ?? null,
      input.created_by,
      input.due_date ?? null,
      input.tags ?? [],
    ],
  );
  return rows[0];
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  due_date?: string | null;
  tags?: string[];
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  const fields: Array<[string, unknown]> = [
    ['title', input.title],
    ['description', input.description],
    ['status', input.status],
    ['priority', input.priority],
    ['assignee_id', input.assignee_id],
    ['due_date', input.due_date],
    ['tags', input.tags],
  ];

  for (const [field, value] of fields) {
    if (value !== undefined) {
      setClauses.push(`${field} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) return getTaskById(id);

  params.push(id);
  const { rows } = await getPool().query<Task>(
    `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params,
  );
  return rows[0] ?? null;
}

export async function deleteTask(id: string): Promise<boolean> {
  const { rowCount } = await getPool().query(
    'DELETE FROM tasks WHERE id = $1',
    [id],
  );
  return (rowCount ?? 0) > 0;
}

export async function canAccessTask(taskId: string, userId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) return true;
  const { rows } = await getPool().query(
    'SELECT 1 FROM tasks WHERE id = $1 AND (created_by = $2 OR assignee_id = $2)',
    [taskId, userId],
  );
  return rows.length > 0;
}
