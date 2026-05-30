import type { ReactNode } from 'react';
import { DashboardCinematicPortal } from './_components/DashboardCinematicPortal';
import '../(auth)/logga-in/_styles/auth-tokens.css';
import '../(auth)/logga-in/_styles/login-cinematic.css';

/** Dashboard layout — shell for all authenticated dashboard pages */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DashboardCinematicPortal />
    </>
  );
}
