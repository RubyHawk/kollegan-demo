import type { ReactNode } from 'react';

/** Auth layout — minimal shell, no sidebar or app chrome */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
