import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/search-bar';

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

describe('SearchBar', () => {
  it('renders search input and button', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('has role="search" wrapper', () => {
    render(<SearchBar />);
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('searches on button click and displays results', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        hits: [
          { id: '1', title: 'Found Task', description: 'desc', score: 1.0 },
        ],
      }),
    } as Response);

    render(<SearchBar />);
    await user.type(screen.getByPlaceholderText('Search tasks...'), 'test');
    await user.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('Found Task')).toBeInTheDocument();
    });
  });

  it('searches on Enter key', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hits: [] }),
    } as Response);

    render(<SearchBar />);
    await user.type(screen.getByPlaceholderText('Search tasks...'), 'query{enter}');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks/search?q=query'),
      );
    });
  });

  it('shows "No results found" for empty results', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hits: [] }),
    } as Response);

    render(<SearchBar />);
    await user.type(screen.getByPlaceholderText('Search tasks...'), 'nothing');
    await user.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<SearchBar />);
    await user.type(screen.getByPlaceholderText('Search tasks...'), 'test');
    await user.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows error message on non-ok response', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    render(<SearchBar />);
    await user.type(screen.getByPlaceholderText('Search tasks...'), 'test');
    await user.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('Search request failed')).toBeInTheDocument();
    });
  });

  it('does not search on empty query', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    await user.click(screen.getByText('Search'));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows "Searching..." while loading', async () => {
    const user = userEvent.setup();
    let resolveRequest!: (value: Response) => void;
    vi.mocked(global.fetch).mockReturnValueOnce(
      new Promise((resolve) => { resolveRequest = resolve; }),
    );

    render(<SearchBar />);
    await user.type(screen.getByPlaceholderText('Search tasks...'), 'test');
    await user.click(screen.getByText('Search'));

    expect(screen.getByText('Searching...')).toBeInTheDocument();

    resolveRequest({ ok: true, json: async () => ({ hits: [] }) } as Response);
  });
});
