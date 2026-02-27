import type { ReactNode } from 'react';

/** Dashboard layout — shell for all authenticated dashboard pages */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
