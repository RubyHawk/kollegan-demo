'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Label } from '@shared/ui/label';
import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';
import { Skeleton } from '@shared/ui/skeleton';
import { Textarea } from '@shared/ui/textarea';
import { Badge } from '@shared/ui/badge';
import { CheckCircleIcon, PlusIcon, TrashIcon } from '@shared/ui/icons';
import {
  createRestaurantEvent,
  deleteRestaurantEvent,
  getPublicSiteSettings,
  listRestaurantEvents,
  savePublicSiteSettings,
  updateRestaurantEvent,
  type PublicSiteSettings,
  type RestaurantEvent,
} from '@shared/lib/api/restaurant.api';

function field(form: FormData, name: string) {
  return String(form.get(name) ?? '').trim();
}

function optionalField(form: FormData, name: string) {
  return field(form, name) || null;
}

function toDateTimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoOrNull(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export function WebbplatsPageClient() {
  const [settings, setSettings] = useState<PublicSiteSettings | null>(null);
  const [events, setEvents] = useState<RestaurantEvent[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState('');

  async function load() {
    try {
      const [nextSettings, nextEvents] = await Promise.all([
        getPublicSiteSettings(),
        listRestaurantEvents(),
      ]);
      setSettings(nextSettings);
      setEvents(nextEvents);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving('settings');
    setError('');
    setNotice('');
    try {
      const next = await savePublicSiteSettings({
        siteName: field(form, 'siteName'),
        heroTitle: field(form, 'heroTitle'),
        heroSubtitle: optionalField(form, 'heroSubtitle'),
        about: optionalField(form, 'about'),
        phone: optionalField(form, 'phone'),
        email: optionalField(form, 'email'),
        addressLine1: optionalField(form, 'addressLine1'),
        addressLine2: optionalField(form, 'addressLine2'),
        postalCode: optionalField(form, 'postalCode'),
        city: optionalField(form, 'city'),
        country: optionalField(form, 'country'),
        reservationEmail: optionalField(form, 'reservationEmail'),
        seoTitle: optionalField(form, 'seoTitle'),
        seoDescription: optionalField(form, 'seoDescription'),
      });
      setSettings(next);
      setNotice('Webbplatsinställningarna är sparade.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving('');
    }
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setSaving('event:create');
    setError('');
    setNotice('');
    try {
      await createRestaurantEvent({
        title: field(form, 'title'),
        description: optionalField(form, 'description'),
        startsAt: new Date(field(form, 'startsAt')).toISOString(),
        endsAt: toIsoOrNull(field(form, 'endsAt')),
        isPublished: form.get('isPublished') === 'on',
      });
      formEl.reset();
      setNotice('Evenemanget är skapat.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving('');
    }
  }

  async function saveEvent(item: RestaurantEvent, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(item.id);
    setError('');
    setNotice('');
    try {
      await updateRestaurantEvent(item.id, {
        title: field(form, 'title'),
        description: optionalField(form, 'description'),
        startsAt: new Date(field(form, 'startsAt')).toISOString(),
        endsAt: toIsoOrNull(field(form, 'endsAt')),
        isPublished: form.get('isPublished') === 'on',
      });
      setNotice('Evenemanget är sparat.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving('');
    }
  }

  async function togglePublished(item: RestaurantEvent) {
    setSaving(`${item.id}:publish`);
    setError('');
    setNotice('');
    try {
      await updateRestaurantEvent(item.id, { isPublished: !item.isPublished });
      setNotice(item.isPublished ? 'Evenemanget är avpublicerat.' : 'Evenemanget är publicerat.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving('');
    }
  }

  async function removeEvent(item: RestaurantEvent) {
    setSaving(`${item.id}:delete`);
    setError('');
    setNotice('');
    try {
      await deleteRestaurantEvent(item.id);
      setNotice('Evenemanget är borttaget.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving('');
    }
  }

  return (
    <div className="fluffy-portal-page space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Restaurang"
        title="Webbplats"
        description="Redigera startsida, kontaktuppgifter, bokningsmail och evenemang."
        actions={<Button type="button" variant="secondary" onClick={() => void load()}>Uppdatera</Button>}
      />
      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Panel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Inställningar</h2>
            <Badge variant="neutral">Publik sida</Badge>
          </div>
          {settings ? (
            <form onSubmit={saveSettings} className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Namn</Label>
                  <Input id="site-name" name="siteName" defaultValue={settings.siteName} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-title">Rubrik</Label>
                  <Input id="hero-title" name="heroTitle" defaultValue={settings.heroTitle} required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="hero-subtitle">Ingress</Label>
                  <Input id="hero-subtitle" name="heroSubtitle" defaultValue={settings.heroSubtitle ?? ''} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="about">Om oss</Label>
                  <Textarea id="about" name="about" defaultValue={settings.about ?? ''} rows={5} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" name="phone" defaultValue={settings.phone ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input id="email" name="email" type="email" defaultValue={settings.email ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reservation-email">Bokningsmail</Label>
                  <Input id="reservation-email" name="reservationEmail" type="email" defaultValue={settings.reservationEmail ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adress</Label>
                  <Input id="address" name="addressLine1" defaultValue={settings.addressLine1 ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address2">Adressrad 2</Label>
                  <Input id="address2" name="addressLine2" defaultValue={settings.addressLine2 ?? ''} />
                </div>
                <div className="grid grid-cols-[0.45fr_1fr_0.35fr] gap-2">
                  <Input name="postalCode" aria-label="Postnummer" defaultValue={settings.postalCode ?? ''} />
                  <Input name="city" aria-label="Ort" defaultValue={settings.city ?? ''} />
                  <Input name="country" aria-label="Land" defaultValue={settings.country ?? 'SE'} maxLength={2} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="seo-title">SEO-titel</Label>
                  <Input id="seo-title" name="seoTitle" defaultValue={settings.seoTitle ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo-description">SEO-beskrivning</Label>
                  <Input id="seo-description" name="seoDescription" defaultValue={settings.seoDescription ?? ''} />
                </div>
              </div>

              <Button type="submit" loading={saving === 'settings'}>
                <CheckCircleIcon />
                Spara inställningar
              </Button>
            </form>
          ) : (
            <div className="space-y-3" aria-label="Laddar webbplatsinställningar" role="status">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Nytt evenemang</h2>
            <form onSubmit={createEvent} className="space-y-3">
              <Input name="title" placeholder="Titel" required />
              <div className="grid gap-2 sm:grid-cols-2">
                <Input name="startsAt" type="datetime-local" required aria-label="Start" />
                <Input name="endsAt" type="datetime-local" aria-label="Slut" />
              </div>
              <Textarea name="description" placeholder="Beskrivning" rows={4} />
              <label className="flex items-center gap-2 text-sm text-[var(--ui-text-secondary)]">
                <input type="checkbox" name="isPublished" className="h-4 w-4 rounded border-[var(--ui-border)] accent-[var(--ui-accent)]" />
                Publicera direkt
              </label>
              <Button type="submit" loading={saving === 'event:create'}>
                <PlusIcon />
                Skapa
              </Button>
            </form>
          </Panel>

          <Panel className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[var(--ui-text)]">Evenemang</h2>
              <Badge variant="neutral">{events.length} st</Badge>
            </div>
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-[var(--ui-text-muted)]">Inga evenemang är upplagda.</p>
              ) : events.map((item) => (
                <form
                  key={item.id}
                  onSubmit={(event) => void saveEvent(item, event)}
                  className="space-y-3 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={item.isPublished ? 'success' : 'neutral'}>
                      {item.isPublished ? 'Publicerad' : 'Utkast'}
                    </Badge>
                    <Button type="button" variant="ghost" size="compact" onClick={() => void togglePublished(item)} loading={saving === `${item.id}:publish`}>
                      {item.isPublished ? 'Avpublicera' : 'Publicera'}
                    </Button>
                  </div>
                  <Input name="title" defaultValue={item.title} required aria-label="Titel" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input name="startsAt" type="datetime-local" defaultValue={toDateTimeLocal(item.startsAt)} required aria-label="Start" />
                    <Input name="endsAt" type="datetime-local" defaultValue={toDateTimeLocal(item.endsAt)} aria-label="Slut" />
                  </div>
                  <Textarea name="description" defaultValue={item.description ?? ''} rows={3} aria-label="Beskrivning" />
                  <input type="hidden" name="isPublished" value={item.isPublished ? 'on' : ''} />
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="compact" loading={saving === item.id}>
                      <CheckCircleIcon />
                      Spara
                    </Button>
                    <Button type="button" size="compact" variant="destructive" onClick={() => void removeEvent(item)} loading={saving === `${item.id}:delete`}>
                      <TrashIcon />
                      Ta bort
                    </Button>
                  </div>
                </form>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
