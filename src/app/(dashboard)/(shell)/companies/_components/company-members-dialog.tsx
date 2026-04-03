'use client';

import { useMemo, useState } from 'react';
import { Buildings, Plus, Trash } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';

export interface CompanyMemberRecord {
  id: string;
  companyId: string;
  userId: string;
  role: 'staff' | 'admin';
  createdAt: string;
  grantedBy?: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

export interface AssignableUserRecord {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

interface CompanyMembersDialogProps {
  open: boolean;
  companyName: string;
  members: CompanyMemberRecord[];
  availableUsers: AssignableUserRecord[];
  loading: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMember: (userId: string, role: 'staff' | 'admin') => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}

function formatUserName(user: { firstName?: string | null; lastName?: string | null; email: string }) {
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return fullName || user.email;
}

export function CompanyMembersDialog({
  open,
  companyName,
  members,
  availableUsers,
  loading,
  saving,
  onOpenChange,
  onAddMember,
  onRemoveMember,
}: CompanyMembersDialogProps) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');

  const selectableUsers = useMemo(() => {
    const existing = new Set(members.map((member) => member.userId));
    return availableUsers.filter((user) => !existing.has(user.id));
  }, [availableUsers, members]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="fullscreen" showMobileClose className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Koppla användare till {companyName}</DialogTitle>
          <DialogDescription>
            De här användarna kan arbeta med företagets mallar, produkter och branding. Företagsadmin får även hantera kopplingar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-alt)] p-4">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] text-[var(--accent)]">
                <Buildings size={18} weight="duotone" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Ny koppling</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                  Välj en användare och om personen bara ska arbeta i företaget eller även administrera kopplingarna.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
              <select
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="">Välj användare</option>
                {selectableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {formatUserName(user as AssignableUserRecord)}
                  </option>
                ))}
              </select>

              <select
                value={role}
                onChange={(event) => setRole(event.target.value as 'staff' | 'admin')}
                className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="staff">Företagsstaff</option>
                <option value="admin">Företagsadmin</option>
              </select>

              <button
                type="button"
                disabled={!userId || saving}
                onClick={async () => {
                  if (!userId) return;
                  await onAddMember(userId, role);
                  setUserId('');
                  setRole('staff');
                }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:pointer-events-none disabled:opacity-50"
              >
                <Plus size={16} weight="bold" />
                Lägg till
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)]">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Kopplade användare</p>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-sm text-[var(--text-muted)]">Laddar kopplingar…</div>
            ) : members.length === 0 ? (
              <div className="px-4 py-8 text-sm text-[var(--text-muted)]">
                Inga användare är kopplade ännu. Lägg till minst en ansvarig användare för att göra företaget aktivt i flödet.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {formatUserName(member.user)}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">{member.user.email}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        {member.role === 'admin' ? 'Admin' : 'Staff'}
                      </span>
                      <button
                        type="button"
                        onClick={() => void onRemoveMember(member.userId)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Ta bort koppling"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-alt)]"
          >
            Stäng
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
