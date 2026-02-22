'use client';

import { HeroUIProvider } from '@heroui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from '@shared/ui/toast/toast-context';
import { useSSE } from '@shared/hooks/use-sse';

function SSEInitializer({ children }: { children: React.ReactNode }) {
  useSSE();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider>
        <ToastProvider>
          <SSEInitializer>
            {children}
          </SSEInitializer>
        </ToastProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}
