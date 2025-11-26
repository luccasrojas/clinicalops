'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/react-query';
import { AuthProvider } from '@/features/auth/contexts/auth-context';
import { ToastProvider } from '@/lib/toast';
import { CleanupSchedulerProvider } from '@/features/recording/components/cleanup-scheduler-provider';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <CleanupSchedulerProvider>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </CleanupSchedulerProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
