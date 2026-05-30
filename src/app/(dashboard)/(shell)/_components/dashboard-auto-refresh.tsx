'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useEffect, useRef } from 'react';

const DASHBOARD_REFRESH_MS = 20_000;
const MIN_MANUAL_REFRESH_GAP_MS = 1_500;

export function DashboardAutoRefresh() {
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    function refresh(force = false) {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      const minGap = force ? MIN_MANUAL_REFRESH_GAP_MS : DASHBOARD_REFRESH_MS;
      if (now - lastRefreshAt.current < minGap) return;

      lastRefreshAt.current = now;
      startTransition(() => {
        router.refresh();
      });
    }

    const interval = window.setInterval(() => refresh(true), DASHBOARD_REFRESH_MS);
    const handleVisible = () => refresh(true);

    window.addEventListener('focus', handleVisible);
    window.addEventListener('pageshow', handleVisible);
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleVisible);
      window.removeEventListener('pageshow', handleVisible);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [router]);

  return null;
}
