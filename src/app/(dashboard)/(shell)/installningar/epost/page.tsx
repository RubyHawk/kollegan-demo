'use client';

import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { getEmailSettings, updateEmailSettings } from '@shared/lib/api/settings.api';
import { FieldLabel, Input, SaveButton, SectionCard } from '../_components/shared';

export default function EpostPage() {
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmailSettings()
      .then((settings) => {
        setSenderEmail(settings.senderEmail ?? '');
        setSenderName(settings.senderName ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setPending(true);
    setSaved(false);
    try {
      await updateEmailSettings({
        senderEmail: senderEmail.trim() || null,
        senderName: senderName.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // Keep this page non-blocking until settings errors have a product flow.
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--ui-text-muted)]">
        <LoaderCircle aria-hidden="true" size={20} strokeWidth={1.75} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title="Avsändaradress"
        description="Ange den e-postadress som utgående offerter och notifieringar skickas ifrån. Adressen måste vara verifierad hos din e-postleverantör."
      >
        <div className="space-y-4">
          <div>
            <FieldLabel description='Visningsnamnet som mottagaren ser, t.ex. "Acme AB"'>
              Avsändarnamn
            </FieldLabel>
            <Input value={senderName} onChange={setSenderName} placeholder="Mitt Företag AB" />
          </div>
          <div>
            <FieldLabel description="E-postadressen som e-post skickas ifrån. Domänen måste vara verifierad i Resend.">
              Avsändaradress
            </FieldLabel>
            <Input value={senderEmail} onChange={setSenderEmail} placeholder="offert@mittforetag.se" type="email" />
          </div>
          <div className="pt-1">
            <SaveButton pending={pending} saved={saved} onClick={handleSave} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Så fungerar det">
        <div className="space-y-2 text-xs leading-relaxed text-[var(--ui-text-muted)]">
          <p>
            När du anger en avsändaradress ovan kommer alla utgående offerter, påminnelser och notifieringar
            att skickas från den adressen istället för standardadressen.
          </p>
          <p>
            Mottagaren ser ditt valda namn och e-postadress i sin inkorg. Lämna fälten tomma
            för att använda systemets standardadress.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
