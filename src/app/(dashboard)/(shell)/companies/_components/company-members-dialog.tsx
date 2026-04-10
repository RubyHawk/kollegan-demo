'use client';

import { useMemo, useState } from 'react';
import { Buildings, Eye, EyeSlash, Plus, Users } from '@phosphor-icons/react';
import { Button } from '@shared/ui/button';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ModalActionFooter,
  ModalBody,
  ModalSection,
} from '@shared/ui/dialog';
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
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none';
const labelCls = 'mb-1.5 block text-xs font-medium text-[var(--text-secondary)]';

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
    () => members.find((member) => member.userId === pendingRemoveId),
    [members, pendingRemoveId],
  );

  const canCreateAccount = newAccount.email.trim().length > 0 && newAccount.password.trim().length >= 8;
  const tabClass = (active: boolean) =>
    active
      ? 'rounded-full bg-[var(--surface)] px-3.5 py-2 text-sm font-medium text-[var(--text-primary)] shadow-sm ring-1 ring-inset ring-[var(--border)]'
      : 'rounded-full px-3.5 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent mobileVariant="fullscreen" size="xl" showMobileClose>
          <div className="flex min-h-0 flex-1 flex-col">
            <DialogHeader className="border-b border-[var(--border)] pr-16">
              <DialogTitle className="text-xl">Koppla användare till {companyName}</DialogTitle>
              <DialogDescription className="max-w-3xl">
                Lägg till befintliga användare eller skapa nya konton direkt i samma flöde. Högerkolumnen visar
                aktuella kopplingar utan extra scrollande listor inuti formuläret.
              </DialogDescription>
            </DialogHeader>

            <ModalBody>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
                <ModalSection tone="card">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                      <Buildings size={18} weight="duotone" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Ny koppling</p>
                      <p className="text-sm leading-6 text-[var(--text-muted)]">
                        Koppla ett befintligt konto eller skapa ett nytt direkt med rätt roll från start.
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-alt)] p-1">
                    <button type="button" onClick={() => setMode('existing')} className={tabClass(mode === 'existing')}>
                      Befintligt konto
                    </button>
                    <button type="button" onClick={() => setMode('create')} className={tabClass(mode === 'create')}>
                      Skapa nytt konto
                    </button>
                  </div>

                  {mode === 'existing' ? (
                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Användare</label>
                        <Select value={userId} onValueChange={setUserId}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Välj användare..." />
                          </SelectTrigger>
                          <SelectContent>
                            {selectableUsers.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-[var(--text-muted)]">Inga tillgängliga användare</div>
                            ) : (
                              selectableUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {formatUserName(user)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className={labelCls}>Roll</label>
                        <Select value={role} onValueChange={(value) => setRole(value as 'staff' | 'admin')}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Företagsstaff</SelectItem>
                            <SelectItem value="admin">Företagsadmin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

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
                        Lägg till användare
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelCls}>Förnamn</label>
                          <input
                            value={newAccount.firstName}
                            onChange={(event) => setNewAccount((current) => ({ ...current, firstName: event.target.value }))}
                            placeholder="Ali"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Efternamn</label>
                          <input
                            value={newAccount.lastName}
                            onChange={(event) => setNewAccount((current) => ({ ...current, lastName: event.target.value }))}
                            placeholder="Zeytoun"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>E-post</label>
                        <input
                          type="email"
                          value={newAccount.email}
                          onChange={(event) => setNewAccount((current) => ({ ...current, email: event.target.value }))}
                          placeholder="namn@foretag.se"
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Tillfälligt lösenord</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={newAccount.password}
                            onChange={(event) => setNewAccount((current) => ({ ...current, password: event.target.value }))}
                            placeholder="Minst 8 tecken"
                            className={`${inputCls} pr-11`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]"
                            aria-label={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
                          >
                            {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Roll</label>
                        <Select
                          value={newAccount.role}
                          onValueChange={(value) =>
                            setNewAccount((current) => ({ ...current, role: value as 'staff' | 'admin' }))
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Företagsstaff</SelectItem>
                            <SelectItem value="admin">Företagsadmin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

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
                </ModalSection>

                <ModalSection tone="card" className="overflow-hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                        <Users size={18} weight="duotone" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Kopplade användare</p>
                        <p className="text-sm leading-6 text-[var(--text-muted)]">
                          Nuvarande teammedlemmar med tillgång till företagets mallar, produkter och branding.
                        </p>
                      </div>
                    </div>
                    {!loading && members.length > 0 ? (
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)]">
                        {members.length}
                      </span>
                    ) : null}
                  </div>

                  {loading ? (
                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                      Laddar kopplingar…
                    </div>
                  ) : members.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-6 py-10 text-center">
                      <p className="text-sm font-medium text-[var(--text-primary)]">Inga kopplade användare än</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                        Lägg till minst en ansvarig för att aktivera företaget i det dagliga flödet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {members.map((member) => {
                        const name = formatUserName(member.user);
                        const isAdmin = member.role === 'admin';
                        return (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-semibold text-[var(--text-secondary)]">
                              {userInitials(name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{name}</p>
                              <p className="truncate text-sm text-[var(--text-muted)]">{member.user.email}</p>
                            </div>
                            <span
                              className={
                                isAdmin
                                  ? 'rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)] ring-1 ring-inset ring-[var(--accent)]/20'
                                  : 'rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]'
                              }
                            >
                              {isAdmin ? 'Admin' : 'Staff'}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setPendingRemoveId(member.userId)}
                              className="h-9 w-9 shrink-0 rounded-xl text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                              title="Ta bort koppling"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                              </svg>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ModalSection>
              </div>
            </ModalBody>

            <ModalActionFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Stäng
              </Button>
            </ModalActionFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={!!pendingRemoveId}
        onOpenChange={(next) => { if (!next) setPendingRemoveId(null); }}
        title={`Ta bort ${pendingMember ? formatUserName(pendingMember.user) : 'användaren'}?`}
        description="Användaren förlorar åtkomst till företagets mallar, produkter och branding. Det går inte att ångra."
        confirmLabel="Ta bort"
        loading={saving && !!pendingRemoveId}
        onConfirm={async () => {
          if (!pendingRemoveId) return;
          await onRemoveMember(pendingRemoveId);
          setPendingRemoveId(null);
        }}
      />
    </>
  );
}
