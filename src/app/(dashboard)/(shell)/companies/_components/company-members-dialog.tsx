'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Building2, Eye, EyeOff, Plus, Trash2, Users } from 'lucide-react';
import { cn } from '@shared/lib/utils';
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
import { EmptyState } from '@shared/ui/empty-state';
import { Input } from '@shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { StatusBadge } from '@shared/ui/status-badge';

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
  return name.split(' ').map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase();
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          mobileVariant="fullscreen"
          size="xl"
          showMobileClose
          className="sm:max-h-[96dvh] sm:max-w-[1180px]"
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <DialogHeader className="border-b border-[var(--ui-border)] pr-16 sm:gap-1 sm:pb-3">
              <DialogTitle className="text-xl">Koppla användare till {companyName}</DialogTitle>
              <DialogDescription className="max-w-2xl sm:leading-5">
                Lägg till befintliga användare eller skapa nya konton direkt i samma flöde. Högerkolumnen visar
                aktuella kopplingar utan extra scrollande listor inuti formuläret.
              </DialogDescription>
            </DialogHeader>

            <ModalBody className="sm:py-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.88fr)]">
                <ModalSection tone="card" className="sm:space-y-3.5 sm:p-4">
                  <SectionIntro
                    icon={Building2}
                    title="Ny koppling"
                    description="Koppla ett befintligt konto eller skapa ett nytt direkt med rätt roll från start."
                  />

                  <div className="inline-flex rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-1">
                    <ModeButton active={mode === 'existing'} onClick={() => setMode('existing')}>Befintligt konto</ModeButton>
                    <ModeButton active={mode === 'create'} onClick={() => setMode('create')}>Skapa nytt konto</ModeButton>
                  </div>

                  {mode === 'existing' ? (
                    <div className="space-y-3.5">
                      <Field label="Användare">
                        <Select value={userId} onValueChange={setUserId}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Välj användare..." />
                          </SelectTrigger>
                          <SelectContent>
                            {selectableUsers.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-[var(--ui-text-muted)]">Inga tillgängliga användare</div>
                            ) : (
                              selectableUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {formatUserName(user)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label="Roll">
                        <Select value={role} onValueChange={(value) => setRole(value as 'staff' | 'admin')}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Företagsstaff</SelectItem>
                            <SelectItem value="admin">Företagsadmin</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Button
                        type="button"
                        disabled={!userId || saving}
                        loading={saving}
                        onClick={async () => {
                          if (!userId) return;
                          await onAddMember(userId, role);
                          setUserId('');
                          setRole('staff');
                        }}
                        className="w-full"
                      >
                        <Plus size={16} strokeWidth={1.75} />
                        Lägg till användare
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Förnamn">
                          <Input value={newAccount.firstName} onChange={(event) => setNewAccount((current) => ({ ...current, firstName: event.target.value }))} placeholder="Ali" />
                        </Field>
                        <Field label="Efternamn">
                          <Input value={newAccount.lastName} onChange={(event) => setNewAccount((current) => ({ ...current, lastName: event.target.value }))} placeholder="Zeytoun" />
                        </Field>
                      </div>

                      <Field label="E-post">
                        <Input type="email" value={newAccount.email} onChange={(event) => setNewAccount((current) => ({ ...current, email: event.target.value }))} placeholder="namn@foretag.se" />
                      </Field>

                      <Field label="Tillfälligt lösenord">
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={newAccount.password}
                            onChange={(event) => setNewAccount((current) => ({ ...current, password: event.target.value }))}
                            placeholder="Minst 8 tecken"
                            className="pr-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[var(--ui-radius-sm)] p-1 text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                            aria-label={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
                          >
                            {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                          </button>
                        </div>
                      </Field>

                      <Field label="Roll">
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
                      </Field>

                      <Button
                        type="button"
                        disabled={!canCreateAccount || saving}
                        loading={saving}
                        onClick={async () => {
                          await onCreateMemberAccount(newAccount);
                          setNewAccount({ email: '', password: '', firstName: '', lastName: '', role: 'staff' });
                          setShowPassword(false);
                        }}
                        className="w-full"
                      >
                        <Plus size={16} strokeWidth={1.75} />
                        Skapa konto och koppla
                      </Button>
                    </div>
                  )}
                </ModalSection>

                <ModalSection tone="card" className="overflow-hidden sm:space-y-3.5 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <SectionIntro
                      icon={Users}
                      title="Kopplade användare"
                      description="Nuvarande teammedlemmar med tillgång till företagets mallar, produkter och branding."
                      compact
                    />
                    {!loading && members.length > 0 ? <StatusBadge tone="neutral">{members.length}</StatusBadge> : null}
                  </div>

                  {loading ? (
                    <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-4 py-8 text-center text-sm text-[var(--ui-text-muted)]">
                      Laddar kopplingar...
                    </div>
                  ) : members.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="Inga kopplade användare än"
                      description="Lägg till minst en ansvarig för att aktivera företaget i det dagliga flödet."
                    />
                  ) : (
                    <div className="space-y-2.5">
                      {members.map((member) => {
                        const name = formatUserName(member.user);
                        const isAdmin = member.role === 'admin';
                        return (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-4 py-3"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] text-xs font-semibold text-[var(--ui-text-secondary)]">
                              {userInitials(name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[var(--ui-text)]">{name}</p>
                              <p className="truncate text-sm text-[var(--ui-text-muted)]">{member.user.email}</p>
                            </div>
                            <StatusBadge tone={isAdmin ? 'accent' : 'neutral'}>{isAdmin ? 'Admin' : 'Staff'}</StatusBadge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setPendingRemoveId(member.userId)}
                              className="h-9 w-9 shrink-0 text-[var(--ui-danger-text)] hover:text-[var(--ui-danger-text)]"
                              aria-label="Ta bort koppling"
                            >
                              <Trash2 size={16} strokeWidth={1.75} />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ModalSection>
              </div>
            </ModalBody>

            <ModalActionFooter className="sm:pb-4 sm:pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Stäng
              </Button>
            </ModalActionFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={!!pendingRemoveId}
        onOpenChange={(next) => {
          if (!next) setPendingRemoveId(null);
        }}
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

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[var(--ui-radius-md)] px-3 py-2 text-sm font-medium text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
        active && 'border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)]',
      )}
    >
      {children}
    </button>
  );
}

function SectionIntro({
  icon: Icon,
  title,
  description,
  compact = false,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-accent)]">
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className={compact ? 'min-w-0 space-y-1' : 'space-y-1'}>
        <p className="text-sm font-semibold text-[var(--ui-text)]">{title}</p>
        <p className="text-sm leading-5 text-[var(--ui-text-muted)]">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-medium text-[var(--ui-text-secondary)]">{label}</span>
      {children}
    </label>
  );
}
