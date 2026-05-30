'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@shared/ui/toast/toast-context';
import { NetworkRetryBanner } from '@shared/ui/network-retry-banner';
import { ThemeBootstrap, shouldLoadThemeProfile } from '@shared/ui/theme-bootstrap';
import { useHotelSSE } from '@demos/hotel/ui/hooks/use-hotel-sse';

function SSEInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useHotelSSE(pathname.startsWith('/demos/hotel'));
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeBootstrap enableProfileSync={shouldLoadThemeProfile(pathname)} />
      <ToastProvider>
        <NetworkRetryBanner />
        <SSEInitializer>
          {children}
        </SSEInitializer>
      </ToastProvider>
    </QueryClientProvider>
  );
}
