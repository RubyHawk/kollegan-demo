'use client';

import { useCallback, useEffect, useState } from 'react';
import { LoaderCircle, Plus, Trash2 } from 'lucide-react';
import {
  createStaffUser,
  deleteStaffUser,
  listStaffUsers,
  type StaffRole,
  type StaffUser,
} from '@shared/lib/api/staff.api';
import { Button } from '@shared/ui/button';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { InlineAlert } from '@shared/ui/inline-alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import { FieldLabel, Input, SectionCard } from '../_components/shared';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  receptionist: 'Receptionist',
};

const ROLE_TONE: Record<string, StatusTone> = {
  admin: 'accent',
  manager: 'info',
  receptionist: 'neutral',
};

const EMPTY_FORM = { email: '', password: '', role: 'receptionist' as StaffRole };

function fmt(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

function RoleBadge({ role }: { role: string }) {
  return (
    <StatusBadge tone={ROLE_TONE[role] ?? 'neutral'}>
      {ROLE_LABEL[role] ?? role}
    </StatusBadge>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<StaffUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listStaffUsers());
    } catch {
      setError('Kunde inte ladda användare. Kontrollera anslutningen och försök igen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveUser = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await createStaffUser({ email: form.email, password: form.password, role: form.role });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch {
      setError('Kunde inte bjuda in användaren. Kontrollera anslutningen och försök igen.');
    } finally {
      setSaving(false);
    }
  }, [form, load]);

  const deleteUser = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await deleteStaffUser(id);
      await load();
    } catch {
      setError('Kunde inte ta bort användaren. Försök igen.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteUser(null);
    }
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button type="button" size="compact" onClick={() => setShowForm(true)}>
          <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
          Ny användare
        </Button>
      </div>

      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      {showForm ? (
        <SectionCard title="Ny användare" description="Skapa ett personalkonto med en tydlig roll och ett starkt startlösenord.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>E-postadress *</FieldLabel>
              <Input
                type="email"
                value={form.email}
                onChange={(email) => setForm((current) => ({ ...current, email }))}
                placeholder="namn@foretag.se"
              />
            </div>
            <div>
              <FieldLabel>Lösenord * (min 12 tecken)</FieldLabel>
              <Input
                type="password"
                value={form.password}
                onChange={(password) => setForm((current) => ({ ...current, password }))}
              />
            </div>
            <div>
              <FieldLabel>Roll</FieldLabel>
              <Select
                value={form.role}
                onValueChange={(role) => setForm((current) => ({ ...current, role: role as StaffRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void saveUser()}
              disabled={saving || !form.email || form.password.length < 12}
              loading={saving}
            >
              {saving ? 'Sparar...' : 'Skapa användare'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
            >
              Avbryt
            </Button>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Användare" description="Översikt över personalkonton och senaste inloggning.">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <LoaderCircle aria-hidden="true" size={20} strokeWidth={1.75} className="animate-spin text-[var(--ui-text-muted)]" />
            <p className="text-sm text-[var(--ui-text-muted)]">Laddar användare...</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)]">
            <table className="min-w-full divide-y divide-[var(--ui-border-subtle)] text-sm">
              <thead className="bg-[var(--ui-surface-subtle)]">
                <tr>
                  {['Användare', 'Roll', 'Skapad', 'Senaste inloggning', ''].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--ui-text-muted)]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ui-border-subtle)] bg-[var(--ui-surface)]">
                {users.map((staffUser) => (
                  <tr key={staffUser.id} className="transition-colors hover:bg-[var(--ui-surface-hover)]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-xs font-bold text-[var(--ui-text-secondary)]">
                          {initials(staffUser.email)}
                        </div>
                        <span className="text-sm font-medium text-[var(--ui-text)]">{staffUser.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <RoleBadge role={staffUser.role} />
                    </td>
                    <td className="px-4 py-3.5 text-[var(--ui-text-muted)]">{fmt(staffUser.createdAt)}</td>
                    <td className="px-4 py-3.5 text-[var(--ui-text-muted)]">{fmt(staffUser.lastLogin)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="compact"
                        onClick={() => setConfirmDeleteUser(staffUser)}
                        disabled={deletingId === staffUser.id}
                      >
                        <Trash2 aria-hidden="true" size={16} strokeWidth={1.75} />
                        Ta bort
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-[var(--ui-text-muted)]">
                      Inga användare hittades.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <ConfirmDestructiveDialog
        open={Boolean(confirmDeleteUser)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteUser(null);
        }}
        title="Ta bort användare?"
        description={
          confirmDeleteUser
            ? `${confirmDeleteUser.email} tas bort från organisationen. Det här går inte att ångra.`
            : 'Användaren tas bort från organisationen. Det här går inte att ångra.'
        }
        confirmLabel="Ta bort användare"
        loading={Boolean(confirmDeleteUser && deletingId === confirmDeleteUser.id)}
        onConfirm={() => {
          if (!confirmDeleteUser) return;
          void deleteUser(confirmDeleteUser.id);
        }}
      />
    </div>
  );
}
