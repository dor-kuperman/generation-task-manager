'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';

const navItems = [
  { href: '/tasks', label: 'Tasks' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/pipeline', label: 'Pipeline' },
];

const adminItems = [
  { href: '/admin/users', label: 'Users' },
];

export function NavSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold">GTM</h1>
        <p className="text-xs text-gray-400 mt-0.5">Generation Task Manager</p>
      </div>

      <nav aria-label="Main navigation" className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              pathname.startsWith(item.href)
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="pt-3 pb-1 px-3 text-xs text-gray-500 uppercase tracking-wider">Admin</div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname.startsWith(item.href)
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800">
        {user && (
          <div className="mb-3">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <Button variant="ghost" size="sm" className="w-full text-gray-300 hover:text-white" onClick={logout}>
          Log out
        </Button>
      </div>
    </aside>
  );
}
