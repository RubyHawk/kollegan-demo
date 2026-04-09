'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@shared/ui/toast/toast-context';
import { useSSE } from '@shared/hooks/use-sse';
import { ThemeBootstrap, shouldLoadThemeProfile } from '@shared/ui/theme-bootstrap';

function SSEInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useSSE(pathname.startsWith('/demos/hotel'));
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeBootstrap enableProfileSync={shouldLoadThemeProfile(pathname)} />
      <ToastProvider>
        <SSEInitializer>
          {children}
        </SSEInitializer>
      </ToastProvider>
    </QueryClientProvider>
  );
}
