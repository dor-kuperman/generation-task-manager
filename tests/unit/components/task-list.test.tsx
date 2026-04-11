import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskList } from '@/components/task-list';
import type { Task } from '@/lib/types';

const mockTask: Task = {
  id: '1',
  title: 'Task One',
  description: 'Description one',
  status: 'todo',
  priority: 'medium',
  assignee_id: null,
  created_by: 'user-1',
  due_date: null,
  tags: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockUseTasks = vi.fn();

vi.mock('@/hooks/use-tasks', () => ({
  useTasks: (...args: unknown[]) => mockUseTasks(...args),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

afterEach(cleanup);

describe('TaskList', () => {
  it('shows loading state', () => {
    mockUseTasks.mockReturnValue({ tasks: [], total: 0, loading: true, error: null, refetch: vi.fn() });
    render(<TaskList />);
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseTasks.mockReturnValue({ tasks: [], total: 0, loading: false, error: 'Network error', refetch: vi.fn() });
    render(<TaskList />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    mockUseTasks.mockReturnValue({ tasks: [], total: 0, loading: false, error: null, refetch: vi.fn() });
    render(<TaskList />);
    expect(screen.getByText('No tasks found.')).toBeInTheDocument();
  });

  it('renders task cards', () => {
    mockUseTasks.mockReturnValue({
      tasks: [mockTask, { ...mockTask, id: '2', title: 'Task Two' }],
      total: 2,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<TaskList />);
    expect(screen.getByText('Task One')).toBeInTheDocument();
    expect(screen.getByText('Task Two')).toBeInTheDocument();
  });

  it('shows pagination when total exceeds limit', () => {
    mockUseTasks.mockReturnValue({
      tasks: Array.from({ length: 20 }, (_, i) => ({ ...mockTask, id: String(i) })),
      total: 40,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<TaskList />);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();
  });

  it('navigates pages via next/previous buttons', async () => {
    const user = userEvent.setup();
    mockUseTasks.mockReturnValue({
      tasks: Array.from({ length: 20 }, (_, i) => ({ ...mockTask, id: String(i) })),
      total: 60,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<TaskList />);
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    await user.click(screen.getByText('Next'));
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

    await user.click(screen.getByText('Previous'));
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('hides pagination when total fits in one page', () => {
    mockUseTasks.mockReturnValue({
      tasks: [mockTask],
      total: 1,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<TaskList />);
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });
});
