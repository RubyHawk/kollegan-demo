'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Label } from '@shared/ui/label';
import { EmptyState } from '@shared/ui/empty-state';
import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';
import { Badge } from '@shared/ui/badge';
import { CheckCircleIcon, LockIcon, PlusIcon, TrashIcon } from '@shared/ui/icons';
import {
  createRestaurantStaff,
  deactivateRestaurantStaff,
  listRestaurantStaff,
  resetRestaurantStaffPin,
  updateRestaurantStaff,
  type RestaurantStaffMember,
  type RestaurantStaffRole,
} from '@shared/lib/api/restaurant-staff.api';

const ROLE_OPTIONS: Array<{ role: RestaurantStaffRole; label: string }> = [
  { role: 'restaurant_owner', label: 'Ägare' },
  { role: 'restaurant_manager', label: 'Chef' },
  { role: 'restaurant_staff', label: 'Personal' },
  { role: 'restaurant_kitchen', label: 'Kök' },
  { role: 'restaurant_accountant', label: 'Ekonomi' },
];

function displayName(member: RestaurantStaffMember) {
  return [member.firstName, member.lastName].filter(Boolean).join(' ') || member.employeeCode || member.email;
}

function displayEmail(email: string) {
  return email.endsWith('@staff.local.invalid') ? 'Ingen e-post angiven' : email;
}

function rolesFromForm(form: FormData): RestaurantStaffRole[] {
  return form.getAll('roles').map(String) as RestaurantStaffRole[];
}

function field(form: FormData, name: string) {
  return String(form.get(name) ?? '').trim();
}

function RoleCheckboxes({ defaultRoles }: { defaultRoles?: RestaurantStaffRole[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {ROLE_OPTIONS.map((option) => (
        <label
          key={option.role}
          className="flex min-h-10 items-center gap-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2 text-sm text-[var(--ui-text-secondary)]"
        >
          <input
            type="checkbox"
            name="roles"
            value={option.role}
            defaultChecked={defaultRoles?.includes(option.role)}
            className="h-4 w-4 rounded border-[var(--ui-border)] accent-[var(--ui-accent)]"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

export function PersonalPageClient() {
  const [staff, setStaff] = useState<RestaurantStaffMember[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setStaff(await listRestaurantStaff());
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await createRestaurantStaff({
        firstName: field(form, 'firstName'),
        lastName: field(form, 'lastName') || null,
        email: field(form, 'email') || null,
        employeeCode: field(form, 'employeeCode'),
        pin: field(form, 'pin'),
        roles: rolesFromForm(form),
      });
      formEl.reset();
      setNotice('Personalen är skapad.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function saveMember(member: RestaurantStaffMember, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusyId(member.id);
    setError('');
    setNotice('');
    try {
      await updateRestaurantStaff(member.id, {
        firstName: field(form, 'firstName'),
        lastName: field(form, 'lastName') || null,
        email: field(form, 'email') || null,
        employeeCode: field(form, 'employeeCode'),
        isActive: form.get('isActive') === 'on',
        roles: rolesFromForm(form),
      });
      setNotice(`${displayName(member)} är uppdaterad.`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId('');
    }
  }

  async function resetPin(member: RestaurantStaffMember, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const pin = field(form, 'pin');
    setBusyId(`${member.id}:pin`);
    setError('');
    setNotice('');
    try {
      await resetRestaurantStaffPin(member.id, pin);
      event.currentTarget.reset();
      setNotice(`PIN är uppdaterad för ${displayName(member)}.`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId('');
    }
  }

  async function deactivate(member: RestaurantStaffMember) {
    setBusyId(`${member.id}:delete`);
    setError('');
    setNotice('');
    try {
      await deactivateRestaurantStaff(member.id);
      setNotice(`${displayName(member)} är inaktiverad.`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Restaurang"
        title="Personal"
        description="Hantera restaurangens användare, roller och PIN-koder för kioskstämpling."
        actions={<Button type="button" variant="secondary" onClick={() => void load()}>Uppdatera</Button>}
      />

      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}

      <Panel className="space-y-4">
        <h2 className="text-sm font-semibold text-[var(--ui-text)]">Ny person</h2>
        <form onSubmit={createStaff} className="grid gap-4 xl:grid-cols-[1fr_1fr_auto] xl:items-end">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staff-first-name">Förnamn</Label>
              <Input id="staff-first-name" name="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-last-name">Efternamn</Label>
              <Input id="staff-last-name" name="lastName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-code">Personalkod</Label>
              <Input id="staff-code" name="employeeCode" minLength={2} maxLength={32} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-pin">PIN</Label>
              <Input id="staff-pin" name="pin" inputMode="numeric" pattern="\d{4,8}" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="staff-email">E-post</Label>
              <Input id="staff-email" name="email" type="email" placeholder="Valfritt" />
            </div>
          </div>
          <RoleCheckboxes defaultRoles={['restaurant_staff']} />
          <Button type="submit" loading={saving}>
            <PlusIcon />
            Lägg till
          </Button>
        </form>
      </Panel>

      <Panel className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--ui-text)]">Aktuella användare</h2>
          <Badge variant="neutral">{staff.length} st</Badge>
        </div>

        <div className="space-y-3">
          {staff.length === 0 ? (
            <EmptyState
              title="Ingen personal är upplagd ännu"
              description="Lägg till den första medarbetaren med formuläret ovan."
            />
          ) : staff.map((member) => (
            <article key={member.id} className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--ui-text)]">{displayName(member)}</h3>
                  <p className="text-xs text-[var(--ui-text-muted)]">
                    {member.employeeCode ?? 'Ingen kod'} · {displayEmail(member.email)}
                  </p>
                </div>
                <Badge variant={member.isActive ? 'success' : 'neutral'}>
                  {member.isActive ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>

              <form onSubmit={(event) => void saveMember(member, event)} className="grid gap-3 lg:grid-cols-[1fr_1fr]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input name="firstName" defaultValue={member.firstName ?? ''} aria-label="Förnamn" required />
                  <Input name="lastName" defaultValue={member.lastName ?? ''} aria-label="Efternamn" />
                  <Input name="employeeCode" defaultValue={member.employeeCode ?? ''} aria-label="Personalkod" minLength={2} maxLength={32} required />
                  <Input name="email" type="email" defaultValue={member.email.endsWith('@staff.local.invalid') ? '' : member.email} aria-label="E-post" />
                </div>
                <div className="space-y-3">
                  <RoleCheckboxes defaultRoles={member.roles} />
                  <label className="flex items-center gap-2 text-sm text-[var(--ui-text-secondary)]">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={member.isActive}
                      className="h-4 w-4 rounded border-[var(--ui-border)] accent-[var(--ui-accent)]"
                    />
                    Aktiv användare
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="compact" loading={busyId === member.id}>
                      <CheckCircleIcon />
                      Spara
                    </Button>
                    <Button
                      type="button"
                      size="compact"
                      variant="destructive"
                      onClick={() => void deactivate(member)}
                      loading={busyId === `${member.id}:delete`}
                    >
                      <TrashIcon />
                      Inaktivera
                    </Button>
                  </div>
                </div>
              </form>

              <form onSubmit={(event) => void resetPin(member, event)} className="mt-4 flex max-w-md gap-2">
                <Input name="pin" inputMode="numeric" pattern="\d{4,8}" placeholder="Ny PIN" aria-label="Ny PIN" required />
                <Button type="submit" variant="secondary" loading={busyId === `${member.id}:pin`}>
                  <LockIcon />
                  PIN
                </Button>
              </form>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
