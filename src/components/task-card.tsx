import Link from 'next/link';
import type { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';

const statusConfig: Record<TaskStatus, { label: string; variant: 'default' | 'info' | 'success' | 'warning' }> = {
  todo: { label: 'To Do', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'info' },
  done: { label: 'Done', variant: 'success' },
  archived: { label: 'Archived', variant: 'warning' },
};

const priorityConfig: Record<TaskPriority, { label: string; variant: 'default' | 'info' | 'warning' | 'danger' }> = {
  low: { label: 'Low', variant: 'default' },
  medium: { label: 'Medium', variant: 'info' },
  high: { label: 'High', variant: 'warning' },
  critical: { label: 'Critical', variant: 'danger' },
};

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant={priority.variant}>{priority.label}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            {task.due_date && (
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                Due: {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
            {task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
