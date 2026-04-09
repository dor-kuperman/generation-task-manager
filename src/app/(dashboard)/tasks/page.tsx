import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/task-list';
import { SearchBar } from '@/components/search-bar';

export default function TasksPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <Link href="/tasks/new">
          <Button>New Task</Button>
        </Link>
      </div>

      <div className="mb-6">
        <SearchBar />
      </div>

      <TaskList />
    </div>
  );
}
