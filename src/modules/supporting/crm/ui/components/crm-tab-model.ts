import type { CrmActivityEvent } from '../../domain/activity.entity';
import type { CrmContact } from '../../domain/contact.entity';

export interface CrmEntry {
  id: string;
  contact: CrmContact;
  timestamp: string;
  bookedRooms: { roomId: string; message: string }[];
  sessionDuration?: number;
}

export interface CallEntry {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  customerName?: string;
  bookedRooms: string[];
  hasCRM: boolean;
  ongoing: boolean;
  confirmed: number;
  cancelled: number;
}

/* ─── Build CRM entries (customer profiles) ──────────────────── */
export function buildCrmEntries(activities: CrmActivityEvent[]): CrmEntry[] {
  const entries: CrmEntry[] = [];
  const ordered = [...activities].reverse();

  let sessionEvts: CrmActivityEvent[] = [];
  let inSession = false;
  let sessionStart: Date | null = null;

  const flush = (endTime?: Date) => {
    const crmEvt = sessionEvts.find(e => e.type === 'crm_contact');
    if (crmEvt?.metadata) {
      const bookedRooms = sessionEvts
        .filter(e => e.type === 'room_confirmed' && e.roomId)
        .map(e => ({ roomId: e.roomId!, message: e.message }));
      const duration = sessionStart && endTime
        ? Math.round((endTime.getTime() - sessionStart.getTime()) / 1000)
        : undefined;
      entries.push({ id: crmEvt.id, contact: crmEvt.metadata, timestamp: crmEvt.timestamp, bookedRooms, sessionDuration: duration });
    }
    sessionEvts = []; inSession = false; sessionStart = null;
  };

  for (const evt of ordered) {
    if (evt.type === 'call_started') {
      if (inSession) flush();
      sessionEvts = [evt]; inSession = true; sessionStart = new Date(evt.timestamp);
    } else if (evt.type === 'call_ended') {
      sessionEvts.push(evt); flush(new Date(evt.timestamp));
    } else if (inSession) {
      sessionEvts.push(evt);
    } else if (evt.type === 'crm_contact' && evt.metadata) {
      entries.push({ id: evt.id, contact: evt.metadata, timestamp: evt.timestamp, bookedRooms: [] });
    }
  }
  if (inSession) flush();
  return entries.reverse();
}

/* ─── Build call log ─────────────────────────────────────────── */
export function buildCallLog(activities: CrmActivityEvent[]): CallEntry[] {
  const entries: CallEntry[] = [];
  const ordered = [...activities].reverse();

  let sessionEvts: CrmActivityEvent[] = [];
  let inSession = false;
  let sessionStart: Date | null = null;
  let idx = 0;

  const flush = (endTime?: Date) => {
    const start = sessionEvts.find(e => e.type === 'call_started');
    if (!start) { sessionEvts = []; inSession = false; sessionStart = null; return; }
    const crmEvt = sessionEvts.find(e => e.type === 'crm_contact');
    const bookedRooms = sessionEvts.filter(e => e.type === 'room_confirmed' && e.roomId).map(e => e.roomId!);
    const confirmed = sessionEvts.filter(e => e.type === 'room_confirmed').length;
    const cancelled = sessionEvts.filter(e => e.type === 'room_cancelled').length;
    const duration = sessionStart && endTime
      ? Math.round((endTime.getTime() - sessionStart.getTime()) / 1000)
      : undefined;
    entries.push({
      id: `call-${idx++}`,
      startTime: start.timestamp,
      endTime: endTime?.toISOString(),
      duration,
      customerName: crmEvt?.metadata?.name,
      bookedRooms,
      hasCRM: !!crmEvt,
      ongoing: !endTime,
      confirmed,
      cancelled,
    });
    sessionEvts = []; inSession = false; sessionStart = null;
  };

  for (const evt of ordered) {
    if (evt.type === 'call_started') {
      if (inSession) flush();
      sessionEvts = [evt]; inSession = true; sessionStart = new Date(evt.timestamp);
    } else if (evt.type === 'call_ended') {
      sessionEvts.push(evt); flush(new Date(evt.timestamp));
    } else if (inSession) {
      sessionEvts.push(evt);
    }
  }
  if (inSession) flush();
  return entries.reverse();
}

/* ─── Helpers ────────────────────────────────────────────────── */
