'use client';

import { TaskForm } from '@/components/task-form';

export default function NewTaskPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Task</h1>
      <TaskForm mode="create" />
    </div>
  );
}
