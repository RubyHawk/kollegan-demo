'use client';

import { useState } from 'react';
import { createPublicReservation } from '@shared/lib/api/restaurant.api';

export function ReservationForm() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
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

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-stone-800">
          Name
          <input name="guestName" required className="h-11 rounded-md border border-stone-300 px-3 text-base" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-stone-800">
          Party
          <input name="partySize" required type="number" min={1} max={40} defaultValue={2} className="h-11 rounded-md border border-stone-300 px-3 text-base" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-stone-800">
          Date
          <input name="date" required type="date" className="h-11 rounded-md border border-stone-300 px-3 text-base" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-stone-800">
          Time
          <input name="time" required type="time" defaultValue="19:00" className="h-11 rounded-md border border-stone-300 px-3 text-base" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-stone-800">
          Email
          <input name="guestEmail" type="email" className="h-11 rounded-md border border-stone-300 px-3 text-base" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-stone-800">
          Phone
          <input name="guestPhone" className="h-11 rounded-md border border-stone-300 px-3 text-base" />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-stone-800">
        Note
        <textarea name="message" rows={3} className="rounded-md border border-stone-300 px-3 py-2 text-base" />
      </label>
      <button
        type="submit"
        disabled={status === 'saving'}
        className="h-11 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {status === 'saving' ? 'Sending...' : 'Request reservation'}
      </button>
      {status === 'sent' ? <p className="text-sm font-medium text-emerald-700">Request sent. We will confirm as soon as possible.</p> : null}
      {status === 'error' ? <p className="text-sm font-medium text-red-700">{error || 'Could not send request.'}</p> : null}
    </form>
  );
}
