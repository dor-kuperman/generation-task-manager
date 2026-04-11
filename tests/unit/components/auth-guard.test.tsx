import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AuthGuard } from '@/components/auth-guard';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
}));

afterEach(cleanup);

describe('AuthGuard', () => {
  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, logout: vi.fn() });
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test', email: 'test@example.com', role: 'user' },
      loading: false,
      logout: vi.fn(),
    });
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('does not render children when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() });
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
