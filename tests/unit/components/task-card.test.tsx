import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TaskCard } from '@/components/task-card';
import type { Task } from '@/lib/types';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

afterEach(cleanup);

describe('TaskCard', () => {
  const baseTask: Task = {
    id: '123',
    title: 'Test Task',
    description: 'A test description',
    status: 'todo',
    priority: 'medium',
    assignee_id: null,
    created_by: '456',
    due_date: null,
    tags: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('renders task title', () => {
    render(<TaskCard task={baseTask} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<TaskCard task={baseTask} />);
    expect(screen.getByText('A test description')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<TaskCard task={baseTask} />);
    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  it('renders priority badge', () => {
    render(<TaskCard task={baseTask} />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(<TaskCard task={{ ...baseTask, tags: ['bug', 'urgent'] }} />);
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('renders due date', () => {
    render(<TaskCard task={{ ...baseTask, due_date: '2024-06-15' }} />);
    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  it('links to task detail page', () => {
    render(<TaskCard task={baseTask} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tasks/123');
  });

  it('shows overdue styling for past due date', () => {
    render(<TaskCard task={{ ...baseTask, due_date: '2020-01-01' }} />);
    const dueElement = screen.getByText(/Due:/);
    expect(dueElement.className).toContain('text-red-600');
  });
});
