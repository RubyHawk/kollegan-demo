'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@shared/lib/utils';
import { updateProfile } from '@shared/lib/api/auth-account.api';
import { SectionCard, FieldLabel, Input, SaveButton, type UserProps } from '../_components/shared';

export default function ProfilClient({ user }: { user: UserProps }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName,  setLastName]  = useState(user.lastName ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ?? null);
  const [pending,   setPending]   = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || user.email;
  const initials    = displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  function pickFile() { fileRef.current?.click(); }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string | undefined;
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setAvatarUrl(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function save() {
    setPending(true); setError(null);
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
        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-[var(--border-light)]">
          <div className="relative group">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <button
              type="button"
              onClick={pickFile}
              className="w-16 h-16 rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
              title="Klicka för att byta profilbild"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{initials}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </button>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--surface-0)] flex items-center justify-center pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{displayName}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 capitalize">{user.role}</p>
            <button type="button" onClick={pickFile} className="mt-1.5 text-[11px] text-[var(--accent)] hover:underline">
              {avatarUrl ? 'Byt profilbild' : 'Ladda upp profilbild'}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <FieldLabel>Förnamn</FieldLabel>
            <Input value={firstName} onChange={setFirstName} placeholder="Ditt förnamn" />
          </div>
          <div>
            <FieldLabel>Efternamn</FieldLabel>
            <Input value={lastName} onChange={setLastName} placeholder="Ditt efternamn" />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <SaveButton pending={pending} saved={saved} onClick={() => void save()} />
      </SectionCard>

      <SectionCard title="Kontoinformation" description="Dessa uppgifter hanteras av din organisation och kan inte ändras här.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>E-postadress</FieldLabel>
            <Input value={user.email} readOnly />
          </div>
          <div>
            <FieldLabel>Roll</FieldLabel>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border-light)] bg-[var(--surface-0)]">
              <span className={cn(
                'px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide',
                user.role === 'admin'
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'bg-[var(--border-light)] text-[var(--text-secondary)]',
              )}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
