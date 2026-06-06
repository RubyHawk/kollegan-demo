'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { updateProfile } from '@shared/lib/api/auth-account.api';
import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';
import { StatusBadge } from '@shared/ui/status-badge';
import { FieldLabel, Input, SaveButton, SectionCard, type UserProps } from '../_components/shared';

export default function ProfilClient({ user }: { user: UserProps }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName, setLastName] = useState(user.lastName ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ?? null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || user.email;
  const initials = displayName.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();

  function pickFile() {
    fileRef.current?.click();
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const dataUrl = readerEvent.target?.result as string | undefined;
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        const max = 400;
        const scale = Math.min(max / img.width, max / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setAvatarUrl(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  async function save() {
    setPending(true);
    setError(null);
    try {
      await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), avatarUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
      router.refresh();
    } catch {
      setError('Kunde inte spara profilinformation. Kontrollera anslutningen och försök igen.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Profilinformation" description="Din synliga identitet inom Soleria.">
        <div className="mb-6 flex items-center gap-4 border-b border-[var(--ui-border-subtle)] pb-5">
          <div className="relative">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <button
              type="button"
              onClick={pickFile}
              className="group relative h-16 w-16 overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:ring-offset-2"
              title="Klicka för att byta profilbild"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--ui-accent)]">
                  <span className="text-xl font-bold text-[var(--ui-text-inverse)]">{initials}</span>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--ui-overlay)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Camera aria-hidden="true" size={18} strokeWidth={1.75} className="text-[var(--ui-text-inverse)]" />
              </div>
            </button>
            <div className="pointer-events-none absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--ui-surface-raised)] bg-[var(--ui-success-bg)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-success-text)]" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{displayName}</p>
            <p className="mt-0.5 text-xs capitalize text-[var(--ui-text-muted)]">{user.role}</p>
            <Button type="button" variant="link" size="compact" onClick={pickFile} className="mt-1.5 h-auto px-0 text-[11px]">
              {avatarUrl ? 'Byt profilbild' : 'Ladda upp profilbild'}
            </Button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Förnamn</FieldLabel>
            <Input value={firstName} onChange={setFirstName} placeholder="Ditt förnamn" />
          </div>
          <div>
            <FieldLabel>Efternamn</FieldLabel>
            <Input value={lastName} onChange={setLastName} placeholder="Ditt efternamn" />
          </div>
        </div>

        {error ? <InlineAlert tone="danger" className="mb-3">{error}</InlineAlert> : null}
        <SaveButton pending={pending} saved={saved} onClick={() => void save()} />
      </SectionCard>

      <SectionCard title="Kontoinformation" description="Dessa uppgifter hanteras av din organisation och kan inte ändras här.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>E-postadress</FieldLabel>
            <Input value={user.email} readOnly />
          </div>
          <div>
            <FieldLabel>Roll</FieldLabel>
            <div className="flex items-center gap-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border-subtle)] bg-[var(--ui-surface)] px-3 py-2.5">
              <StatusBadge tone={user.role === 'admin' ? 'accent' : 'neutral'}>
                {user.role}
              </StatusBadge>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
