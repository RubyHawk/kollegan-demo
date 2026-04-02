'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@shared/ui/toast/toast-context';
import { useSSE } from '@shared/hooks/use-sse';

function SSEInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useSSE(pathname.startsWith('/demos/hotel'));
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SSEInitializer>
          {children}
        </SSEInitializer>
      </ToastProvider>
    </QueryClientProvider>
  );
}
