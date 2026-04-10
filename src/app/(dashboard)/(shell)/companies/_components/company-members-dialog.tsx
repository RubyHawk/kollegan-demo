'use client';

import { useMemo, useState } from 'react';
import { Buildings, Eye, EyeSlash, Plus, Users } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';

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

function formatUserName(user: { firstName?: string | null; lastName?: string | null; email: string }) {
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return fullName || user.email;
}

function userInitials(name: string) {
  return name.split(' ').map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase();
}

const inputCls =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-0)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none';

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
    role: 'staff',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const selectableUsers = useMemo(() => {
    const existing = new Set(members.map((member) => member.userId));
    return availableUsers.filter((user) => !existing.has(user.id));
  }, [availableUsers, members]);

  const pendingMember = useMemo(
    () => members.find((m) => m.userId === pendingRemoveId),
    [members, pendingRemoveId],
  );

  const canCreateAccount = newAccount.email.trim().length > 0 && newAccount.password.trim().length >= 8;

  const tabCls = (active: boolean) =>
    `pb-2.5 text-sm font-medium transition-colors border-b-2 ${
      active
        ? 'border-[var(--accent)] text-[var(--text-primary)]'
        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
    }`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent mobileVariant="fullscreen" showMobileClose className="w-[min(100vw-1.5rem,860px)] sm:max-w-[860px]">
          <DialogHeader className="border-b border-[var(--border)] px-5 pb-4 pt-5 pr-16 sm:px-6">
            <DialogTitle>Koppla användare till {companyName}</DialogTitle>
            <DialogDescription>
              De här användarna kan arbeta med företagets mallar, produkter och branding. Företagsadmin får även hantera kopplingar och skapa nya konton.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[min(88dvh,760px)] overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid gap-5 sm:grid-cols-2">

              {/* Left panel — Add user */}
              <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-0)] p-4">
                <div className="mb-4 flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                    <Buildings size={17} weight="duotone" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Ny koppling</p>
                    <p className="mt-0.5 text-xs leading-5 text-[var(--text-muted)]">
                      Koppla ett befintligt konto eller skapa ett nytt direkt.
                    </p>
                  </div>
                </div>

                {/* Mode tabs */}
                <div className="flex gap-5 border-b border-[var(--border)]">
                  <button type="button" onClick={() => setMode('existing')} className={tabCls(mode === 'existing')}>
                    Befintligt konto
                  </button>
                  <button type="button" onClick={() => setMode('create')} className={tabCls(mode === 'create')}>
                    Skapa nytt konto
                  </button>
                </div>

                {mode === 'existing' ? (
                  <div className="mt-4 space-y-3">
                    <Select value={userId} onValueChange={setUserId}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Välj användare…" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectableUsers.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-[var(--text-muted)]">Inga tillgängliga användare</div>
                        ) : (
                          selectableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {formatUserName(user as AssignableUserRecord)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    <Select value={role} onValueChange={(v) => setRole(v as 'staff' | 'admin')}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Företagsstaff</SelectItem>
                        <SelectItem value="admin">Företagsadmin</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      disabled={!userId || saving}
                      onClick={async () => {
                        if (!userId) return;
                        await onAddMember(userId, role);
                        setUserId('');
                        setRole('staff');
                      }}
                      className="w-full"
                    >
                      <Plus size={15} weight="bold" />
                      Lägg till
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={newAccount.firstName}
                        onChange={(e) => setNewAccount((c) => ({ ...c, firstName: e.target.value }))}
                        placeholder="Förnamn"
                        className={inputCls}
                      />
                      <input
                        value={newAccount.lastName}
                        onChange={(e) => setNewAccount((c) => ({ ...c, lastName: e.target.value }))}
                        placeholder="Efternamn"
                        className={inputCls}
                      />
                    </div>

                    <input
                      type="email"
                      value={newAccount.email}
                      onChange={(e) => setNewAccount((c) => ({ ...c, email: e.target.value }))}
                      placeholder="namn@foretag.se"
                      className={inputCls}
                    />

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newAccount.password}
                        onChange={(e) => setNewAccount((c) => ({ ...c, password: e.target.value }))}
                        placeholder="Tillfälligt lösenord (minst 8 tecken)"
                        className={`${inputCls} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
                      >
                        {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <Select value={newAccount.role} onValueChange={(v) => setNewAccount((c) => ({ ...c, role: v as 'staff' | 'admin' }))}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Företagsstaff</SelectItem>
                        <SelectItem value="admin">Företagsadmin</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      disabled={!canCreateAccount || saving}
                      onClick={async () => {
                        await onCreateMemberAccount(newAccount);
                        setNewAccount({ email: '', password: '', firstName: '', lastName: '', role: 'staff' });
                        setShowPassword(false);
                      }}
                      className="w-full"
                    >
                      <Plus size={15} weight="bold" />
                      Skapa konto och koppla
                    </Button>
                  </div>
                )}
              </section>

              {/* Right panel — Members list */}
              <section className="flex flex-col rounded-[24px] border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Kopplade användare</p>
                  {members.length > 0 && (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                      {members.length}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="flex flex-1 items-center justify-center px-4 py-10 text-sm text-[var(--text-muted)]">
                    Laddar kopplingar…
                  </div>
                ) : members.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-muted)]">
                      <Users size={20} weight="duotone" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Inga kopplade användare</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                        Lägg till minst en ansvarig för att aktivera företaget i flödet.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {members.map((member) => {
                      const name = formatUserName(member.user);
                      const isAdmin = member.role === 'admin';
                      return (
                        <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                          {/* Avatar initials */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-alt)] text-xs font-semibold text-[var(--text-secondary)]">
                            {userInitials(name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--text-primary)]">{name}</p>
                            <p className="truncate text-xs text-[var(--text-muted)]">{member.user.email}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                                isAdmin
                                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] ring-1 ring-inset ring-[var(--accent)]/20'
                                  : 'border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-muted)]'
                              }`}
                            >
                              {isAdmin ? 'Admin' : 'Staff'}
                            </span>

                            <button
                              type="button"
                              onClick={() => setPendingRemoveId(member.userId)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-800 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                              title="Ta bort koppling"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

            </div>
          </div>

          <DialogFooter className="border-t border-[var(--border)] px-5 pb-5 pt-3 sm:px-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Stäng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={!!pendingRemoveId}
        onOpenChange={(next) => { if (!next) setPendingRemoveId(null); }}
        title={`Ta bort ${pendingMember ? formatUserName(pendingMember.user) : 'användaren'}?`}
        description="Användaren förlorar åtkomst till företagets mallar, produkter och branding. Det går inte att ångra."
        confirmLabel="Ta bort"
        onConfirm={async () => {
          if (!pendingRemoveId) return;
          await onRemoveMember(pendingRemoveId);
          setPendingRemoveId(null);
        }}
      />
    </>
  );
}
