'use client';

import { useState, type FormEvent } from 'react';
import { createPublicReservation } from '@shared/lib/api/restaurant.api';

export function ReservationForm() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus('saving');
    setError('');

    try {
      const date = String(form.get('date') ?? '');
      const time = String(form.get('time') ?? '');
      await createPublicReservation({
        guestName: String(form.get('guestName') ?? ''),
        guestEmail: String(form.get('guestEmail') ?? '') || null,
        guestPhone: String(form.get('guestPhone') ?? '') || null,
        partySize: Number(form.get('partySize') ?? 2),
        requestedAt: new Date(`${date}T${time || '19:00'}:00`).toISOString(),
        message: String(form.get('message') ?? '') || null,
      });
      event.currentTarget.reset();
      setStatus('sent');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  const inputClass = 'h-11 rounded-md border border-[#211f1c]/20 bg-white px-3 text-base text-[#211f1c] outline-none focus:ring-2 focus:ring-[#f4d06f]';
  const labelClass = 'grid gap-1 text-sm font-bold text-[#211f1c]';

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border border-[#211f1c]/10 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Namn
          <input name="guestName" required className={inputClass} />
        </label>
        <label className={labelClass}>
          Antal
          <input name="partySize" required type="number" min={1} max={40} defaultValue={2} className={inputClass} />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Datum
          <input name="date" required type="date" className={inputClass} />
        </label>
        <label className={labelClass}>
          Tid
          <input name="time" required type="time" defaultValue="19:00" className={inputClass} />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          E-post
          <input name="guestEmail" type="email" className={inputClass} />
        </label>
        <label className={labelClass}>
          Telefon
          <input name="guestPhone" className={inputClass} />
        </label>
      </div>
      <label className={labelClass}>
        Meddelande
        <textarea name="message" rows={3} className="rounded-md border border-[#211f1c]/20 bg-white px-3 py-2 text-base text-[#211f1c] outline-none focus:ring-2 focus:ring-[#f4d06f]" />
      </label>
      <button
        type="submit"
        disabled={status === 'saving'}
        className="h-11 rounded-md bg-[#211f1c] px-4 text-sm font-black text-white transition hover:bg-[#bf4f2f] disabled:opacity-60"
      >
        {status === 'saving' ? 'Skickar...' : 'Skicka bokningsförfrågan'}
      </button>
      {status === 'sent' ? <p className="text-sm font-bold text-[#2f7d52]">Förfrågan är skickad. Vi återkommer med bekräftelse.</p> : null}
      {status === 'error' ? <p className="text-sm font-bold text-[#a33a2f]">{error || 'Det gick inte att skicka förfrågan.'}</p> : null}
    </form>
  );
}
