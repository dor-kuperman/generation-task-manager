'use client';

import { useState } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { TaskCard } from './task-card';
import { Button } from './ui/button';
import type { TaskStatus, TaskPriority } from '@/lib/types';

export function TaskList() {
  const [status, setStatus] = useState<TaskStatus | undefined>();
  const [priority, setPriority] = useState<TaskPriority | undefined>();
  const [page, setPage] = useState(0);
  const limit = 20;

  const { tasks, total, loading, error, refetch } = useTasks({
    status,
    priority,
    limit,
    offset: page * limit,
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={status ?? ''}
          onChange={(e) => { setStatus(e.target.value as TaskStatus || undefined); setPage(0); }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={priority ?? ''}
          onChange={(e) => { setPriority(e.target.value as TaskPriority || undefined); setPage(0); }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {loading && <p className="text-gray-500 py-8 text-center">Loading tasks...</p>}
      {error && <p className="text-red-600 py-8 text-center">{error}</p>}

      {!loading && tasks.length === 0 && (
        <p className="text-gray-500 py-8 text-center">No tasks found.</p>
      )}

      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
