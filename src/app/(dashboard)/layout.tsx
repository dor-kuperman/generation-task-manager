'use client';

import { NavSidebar } from '@/components/nav-sidebar';
import { AuthGuard } from '@/components/auth-guard';
import { ToastProvider } from '@/components/ui/toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthGuard>
        <div className="flex h-full">
          <NavSidebar />
          <main className="flex-1 overflow-auto bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
          </main>
        </div>
      </AuthGuard>
    </ToastProvider>
  );
}
