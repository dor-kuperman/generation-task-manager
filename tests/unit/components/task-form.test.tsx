import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '@/components/task-form';

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();
const mockToast = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

describe('TaskForm', () => {
  describe('create mode', () => {
    it('renders empty form for creation', () => {
      render(<TaskForm mode="create" />);
      expect(screen.getByLabelText('Title')).toHaveValue('');
      expect(screen.getByText('Create Task')).toBeInTheDocument();
    });

    it('submits create form and navigates on success', async () => {
      const user = userEvent.setup();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: { id: 'new-task-1' } }),
      } as Response);

      render(<TaskForm mode="create" />);
      await user.type(screen.getByLabelText('Title'), 'New Task');
      await user.click(screen.getByText('Create Task'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({ method: 'POST' }));
        expect(mockToast).toHaveBeenCalledWith('Task created', 'success');
        expect(mockPush).toHaveBeenCalledWith('/tasks/new-task-1');
      });
    });

    it('shows error toast on failed submission', async () => {
      const user = userEvent.setup();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Title too long' } }),
      } as Response);

      render(<TaskForm mode="create" />);
      await user.type(screen.getByLabelText('Title'), 'X');
      await user.click(screen.getByText('Create Task'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('Title too long', 'error');
      });
    });

    it('disables submit button while loading', async () => {
      const user = userEvent.setup();
      let resolveRequest!: (value: Response) => void;
      vi.mocked(global.fetch).mockReturnValueOnce(
        new Promise((resolve) => { resolveRequest = resolve; }),
      );

      render(<TaskForm mode="create" />);
      await user.type(screen.getByLabelText('Title'), 'Test');
      await user.click(screen.getByText('Create Task'));

      expect(screen.getByText('Saving...')).toBeDisabled();

      resolveRequest({ ok: true, json: async () => ({ task: { id: '1' } }) } as Response);
    });
  });

  describe('edit mode', () => {
    const existingTask = {
      id: 'task-1',
      title: 'Existing Task',
      description: 'A description',
      status: 'in_progress' as const,
      priority: 'high' as const,
      assignee_id: null,
      created_by: 'user-1',
      due_date: '2024-06-01',
      tags: ['bug', 'urgent'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    it('pre-fills form with task data', () => {
      render(<TaskForm mode="edit" task={existingTask} />);
      expect(screen.getByLabelText('Title')).toHaveValue('Existing Task');
      expect(screen.getByText('Update Task')).toBeInTheDocument();
    });

    it('submits edit form with PATCH method', async () => {
      const user = userEvent.setup();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: { id: 'task-1' } }),
      } as Response);

      render(<TaskForm mode="edit" task={existingTask} />);
      await user.click(screen.getByText('Update Task'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tasks/task-1', expect.objectContaining({ method: 'PATCH' }));
      });
    });
  });

  it('navigates back on cancel', async () => {
    const user = userEvent.setup();
    render(<TaskForm mode="create" />);
    await user.click(screen.getByText('Cancel'));
    expect(mockBack).toHaveBeenCalled();
  });
});
