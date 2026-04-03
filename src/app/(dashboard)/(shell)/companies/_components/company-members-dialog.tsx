'use client';

import React, { useMemo, useState } from 'react';
import { Buildings, CaretDown, Plus, Trash } from '@phosphor-icons/react';
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

export interface NewCompanyAccountForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'staff' | 'admin';
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
  onCreateMemberAccount: (form: NewCompanyAccountForm) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}

function StyledSelect({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <select
        {...props}
        className="h-12 w-full appearance-none rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] pl-4 pr-10 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
      >
        {children}
      </select>
      <CaretDown
        size={14}
        weight="bold"
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
      />
    </div>
  );
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
  onCreateMemberAccount,
  onRemoveMember,
}: CompanyMembersDialogProps) {
  const [mode, setMode] = useState<'existing' | 'create'>('existing');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [newAccount, setNewAccount] = useState<NewCompanyAccountForm>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'admin',
  });

  const selectableUsers = useMemo(() => {
    const existing = new Set(members.map((member) => member.userId));
    return availableUsers.filter((user) => !existing.has(user.id));
  }, [availableUsers, members]);

  const canCreateAccount = newAccount.email.trim().length > 0 && newAccount.password.trim().length >= 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="fullscreen" showMobileClose className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Koppla användare till {companyName}</DialogTitle>
          <DialogDescription>
            De här användarna kan arbeta med företagets mallar, produkter och branding. Företagsadmin får även hantera kopplingar och skapa nya konton för sitt företag.
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
                  Koppla ett befintligt konto eller skapa ett nytt staff-konto direkt för företaget.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${mode === 'existing' ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] bg-[var(--surface-0)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}
              >
                Koppla befintligt konto
              </button>
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${mode === 'create' ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] bg-[var(--surface-0)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}
              >
                Skapa nytt konto
              </button>
            </div>

            {mode === 'existing' ? (
              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                <StyledSelect value={userId} onChange={(event) => setUserId(event.target.value)}>
                  <option value="">Välj användare</option>
                  {selectableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {formatUserName(user as AssignableUserRecord)}
                    </option>
                  ))}
                </StyledSelect>

                <StyledSelect value={role} onChange={(event) => setRole(event.target.value as 'staff' | 'admin')}>
                  <option value="staff">Företagsstaff</option>
                  <option value="admin">Företagsadmin</option>
                </StyledSelect>

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
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  value={newAccount.firstName}
                  onChange={(event) => setNewAccount((current) => ({ ...current, firstName: event.target.value }))}
                  placeholder="Förnamn"
                  className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
                <input
                  value={newAccount.lastName}
                  onChange={(event) => setNewAccount((current) => ({ ...current, lastName: event.target.value }))}
                  placeholder="Efternamn"
                  className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
                <input
                  type="email"
                  value={newAccount.email}
                  onChange={(event) => setNewAccount((current) => ({ ...current, email: event.target.value }))}
                  placeholder="namn@foretag.se"
                  className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none md:col-span-2"
                />
                <input
                  type="password"
                  value={newAccount.password}
                  onChange={(event) => setNewAccount((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Tillfälligt lösenord"
                  className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
                <StyledSelect value={newAccount.role} onChange={(event) => setNewAccount((current) => ({ ...current, role: event.target.value as 'staff' | 'admin' }))}>
                  <option value="staff">Företagsstaff</option>
                  <option value="admin">Företagsadmin</option>
                </StyledSelect>
                <button
                  type="button"
                  disabled={!canCreateAccount || saving}
                  onClick={async () => {
                    await onCreateMemberAccount(newAccount);
                    setNewAccount({
                      email: '',
                      password: '',
                      firstName: '',
                      lastName: '',
                      role: 'admin',
                    });
                  }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:pointer-events-none disabled:opacity-50 md:col-span-2"
                >
                  <Plus size={16} weight="bold" />
                  Skapa konto och koppla
                </button>
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)]">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Kopplade användare</p>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-sm text-[var(--text-muted)]">Laddar kopplingar...</div>
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
