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

  return (
    <form onSubmit={onSubmit} className="fluffy-card fluffy-form">
      <div className="fluffy-form__grid">
        <label className="fluffy-field">
          Namn
          <input name="guestName" required className="fluffy-input" autoComplete="name" />
        </label>
        <label className="fluffy-field">
          Antal
          <input name="partySize" required type="number" min={1} max={40} defaultValue={2} className="fluffy-input" />
        </label>
      </div>
      <div className="fluffy-form__grid">
        <label className="fluffy-field">
          Datum
          <input name="date" required type="date" className="fluffy-input" />
        </label>
        <label className="fluffy-field">
          Tid
          <input name="time" required type="time" defaultValue="19:00" className="fluffy-input" />
        </label>
      </div>
      <div className="fluffy-form__grid">
        <label className="fluffy-field">
          E-post
          <input name="guestEmail" type="email" className="fluffy-input" autoComplete="email" />
        </label>
        <label className="fluffy-field">
          Telefon
          <input name="guestPhone" className="fluffy-input" autoComplete="tel" />
        </label>
      </div>
      <label className="fluffy-field">
        Meddelande
        <textarea name="message" rows={3} className="fluffy-input" />
      </label>
      <button
        type="submit"
        disabled={status === 'saving'}
        className="fluffy-button fluffy-button--dark"
      >
        {status === 'saving' ? 'Skickar...' : 'Skicka bokningsförfrågan'}
      </button>
      {status === 'sent' ? <p role="status" className="fluffy-success">Förfrågan är skickad. Vi återkommer med bekräftelse.</p> : null}
      {status === 'error' ? <p role="alert" className="fluffy-error">{error || 'Det gick inte att skicka förfrågan.'}</p> : null}
    </form>
  );
}
