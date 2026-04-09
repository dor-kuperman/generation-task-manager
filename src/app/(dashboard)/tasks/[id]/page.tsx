'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TaskForm } from '@/components/task-form';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import type { Task } from '@/lib/types';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tasks/${params.id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setTask(data.task);
      } catch {
        toast('Task not found', 'error');
        router.push('/tasks');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, router, toast]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast('Task deleted', 'success');
      router.push('/tasks');
      router.refresh();
    } catch {
      toast('Failed to delete task', 'error');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading...</div>;
  }

  if (!task) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </div>

      <TaskForm task={task} mode="edit" />

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Task"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        Are you sure you want to delete &quot;{task.title}&quot;? This action cannot be undone.
      </Dialog>
    </div>
  );
}
