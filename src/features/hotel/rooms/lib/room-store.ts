import fs from 'fs';
import path from 'path';
import { Room, RoomStoreState } from '@features/hotel/rooms/types';
import { ActivityEvent } from '@features/activity/types';
import { broadcast } from '@infra/sse/sse-manager';
import { createCalendarEvent, deleteCalendarEvent } from '@infra/calendar/google-calendar';
import { eventBus } from '@core/events';
import { logger } from '@core/logging/logger';
import {
  ROOM_LOCKED,
  ROOM_BOOKED,
  ROOM_CANCELLED,
  ROOM_QUERIED,
} from '@features/hotel/rooms/events';
import type {
  RoomLockedEvent,
  RoomBookedEvent,
  RoomCancelledEvent,
  RoomQueriedEvent,
} from '@features/hotel/rooms/events';

// Organization ID for domain events.
// Set DEMO_ORG_ID in .env.local once the identity module is wired up.
const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? 'demo';

const TAG = 'RoomStore';

const DATA_PATH = path.join(process.cwd(), 'data', 'rooms.json');

const INITIAL_ROOMS: Room[] = [
  // Floor 1
  { id: '101', floor: 1, number: 101, type: 'Enkel', status: 'available' },
  { id: '102', floor: 1, number: 102, type: 'Enkel', status: 'available' },
  { id: '103', floor: 1, number: 103, type: 'Dubbel', status: 'available' },
  { id: '104', floor: 1, number: 104, type: 'Dubbel', status: 'available' },
  // Floor 2
  { id: '201', floor: 2, number: 201, type: 'Enkel', status: 'available' },
  { id: '202', floor: 2, number: 202, type: 'Enkel', status: 'available' },
  { id: '203', floor: 2, number: 203, type: 'Dubbel', status: 'available' },
  { id: '204', floor: 2, number: 204, type: 'Dubbel', status: 'available' },
  { id: '205', floor: 2, number: 205, type: 'Svit', status: 'available' },
  // Floor 3
  { id: '301', floor: 3, number: 301, type: 'Dubbel', status: 'available' },
  { id: '302', floor: 3, number: 302, type: 'Svit', status: 'available' },
  { id: '303', floor: 3, number: 303, type: 'Svit', status: 'available' },
];

declare global {
  // eslint-disable-next-line no-var
  var __roomStore: RoomStoreState | undefined;
}

function loadFromDisk(): RoomStoreState {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    logger.warn(TAG, 'Failed to load from disk, using defaults');
  }
  return { rooms: INITIAL_ROOMS.map((r) => ({ ...r })), recentActivity: [], onCall: false };
}

function getStore(): RoomStoreState {
  if (!global.__roomStore) {
    global.__roomStore = loadFromDisk();
  }
  return global.__roomStore;
}

function saveToDisk(store: RoomStoreState): void {
  try {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    logger.error(TAG, 'Failed to save to disk', e);
  }
}

function addActivity(
  store: RoomStoreState,
  event: Omit<ActivityEvent, 'id' | 'timestamp'>
): ActivityEvent {
  const activity: ActivityEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  store.recentActivity = [activity, ...store.recentActivity].slice(0, 50);
  broadcast({ type: 'activity', payload: activity });
  return activity;
}

export function getAllRooms(): Room[] {
  return getStore().rooms;
}

export function getAvailableRooms(): Room[] {
  return getStore().rooms.filter((r) => r.status === 'available');
}

export function lockRoom(roomId: string): { success: boolean; message: string; room?: Room } {
  const store = getStore();
  const room = store.rooms.find((r) => r.id === roomId);

  if (!room) return { success: false, message: `Rum ${roomId} hittades inte.` };
  if (room.status !== 'available') {
    return {
      success: false,
      message: `Rum ${roomId} är inte tillgängligt (status: ${room.status}).`,
    };
  }

  room.status = 'locked';
  room.lockedAt = new Date().toISOString();

  addActivity(store, {
    type: 'room_locked',
    message: `Rum ${roomId} (${room.type}) reserveras under pågående samtal.`,
    roomId,
  });

  broadcast({ type: 'room_update', payload: { ...room } });
  saveToDisk(store);

  eventBus.publish<RoomLockedEvent>({
    type: ROOM_LOCKED,
    orgId: DEMO_ORG_ID,
    occurredAt: new Date().toISOString(),
    payload: { roomId, roomType: room.type },
  });

  return { success: true, message: `Rum ${roomId} är nu låst för bokning.`, room };
}

export async function confirmBooking(
  roomId: string,
  guestName: string,
  checkIn?: string,
  checkOut?: string
): Promise<{ success: boolean; message: string; room?: Room }> {
  const store = getStore();
  const room = store.rooms.find((r) => r.id === roomId);

  if (!room) return { success: false, message: `Rum ${roomId} hittades inte.` };
  if (room.status !== 'locked') {
    return { success: false, message: `Rum ${roomId} är inte låst för bekräftelse.` };
  }

  room.status = 'booked';
  room.guestName = guestName;
  room.bookedAt = new Date().toISOString();
  room.checkIn = checkIn;
  room.checkOut = checkOut;

  // Create Google Calendar event if dates are provided
  if (checkIn && checkOut) {
    try {
      const eventId = await createCalendarEvent({
        roomId,
        roomType: room.type,
        guestName,
        checkIn,
        checkOut,
      });
      if (eventId) {
        room.calendarEventId = eventId;
      }
    } catch (err) {
      logger.error(TAG, 'Failed to create calendar event', err);
    }
  }

  const dateInfo = checkIn && checkOut ? ` (${checkIn} → ${checkOut})` : '';
  addActivity(store, {
    type: 'room_confirmed',
    message: `Rum ${roomId} bokades av ${guestName}.${dateInfo}`,
    roomId,
  });

  broadcast({ type: 'room_update', payload: { ...room } });
  saveToDisk(store);

  eventBus.publish<RoomBookedEvent>({
    type: ROOM_BOOKED,
    orgId: DEMO_ORG_ID,
    occurredAt: new Date().toISOString(),
    payload: { roomId, roomType: room.type, guestName, checkIn, checkOut },
  });

  return {
    success: true,
    message: `Bokning bekräftad! Rum ${roomId} är bokat för ${guestName}.`,
    room,
  };
}

export async function cancelBooking(
  roomId: string
): Promise<{ success: boolean; message: string; room?: Room }> {
  const store = getStore();
  const room = store.rooms.find((r) => r.id === roomId);

  if (!room) return { success: false, message: `Rum ${roomId} hittades inte.` };
  if (room.status === 'available') {
    return { success: false, message: `Rum ${roomId} är redan tillgängligt.` };
  }

  // Delete Google Calendar event if one exists
  if (room.calendarEventId) {
    try {
      await deleteCalendarEvent(room.calendarEventId);
    } catch (err) {
      logger.error(TAG, 'Failed to delete calendar event', err);
    }
  }

  const prevGuest = room.guestName;
  room.status = 'available';
  room.guestName = undefined;
  room.lockedAt = undefined;
  room.bookedAt = undefined;
  room.checkIn = undefined;
  room.checkOut = undefined;
  room.calendarEventId = undefined;

  addActivity(store, {
    type: 'room_cancelled',
    message: prevGuest
      ? `Bokning för ${prevGuest} i rum ${roomId} avbokades.`
      : `Rum ${roomId} är nu tillgängligt igen.`,
    roomId,
  });

  broadcast({ type: 'room_update', payload: { ...room } });
  saveToDisk(store);

  eventBus.publish<RoomCancelledEvent>({
    type: ROOM_CANCELLED,
    orgId: DEMO_ORG_ID,
    occurredAt: new Date().toISOString(),
    payload: { roomId, prevGuestName: prevGuest },
  });

  return { success: true, message: `Bokning för rum ${roomId} har avbokats.`, room };
}

export async function bookRoom(
  roomId: string,
  guestName: string,
  checkIn: string,
  checkOut: string
): Promise<{ success: boolean; message: string; room?: Room }> {
  const store = getStore();
  const room = store.rooms.find((r) => r.id === roomId);

  if (!room) return { success: false, message: `Rum ${roomId} hittades inte.` };
  if (room.status !== 'available') {
    return { success: false, message: `Rum ${roomId} är inte tillgängligt.` };
  }

  room.status = 'booked';
  room.guestName = guestName;
  room.bookedAt = new Date().toISOString();
  room.checkIn = checkIn;
  room.checkOut = checkOut;

  try {
    const eventId = await createCalendarEvent({
      roomId,
      roomType: room.type,
      guestName,
      checkIn,
      checkOut,
    });
    if (eventId) {
      room.calendarEventId = eventId;
    }
  } catch (err) {
    logger.error(TAG, 'Failed to create calendar event', err);
  }

  addActivity(store, {
    type: 'room_confirmed',
    message: `Rum ${roomId} bokades av ${guestName}. (${checkIn} → ${checkOut})`,
    roomId,
  });

  broadcast({ type: 'room_update', payload: { ...room } });
  saveToDisk(store);

  eventBus.publish<RoomBookedEvent>({
    type: ROOM_BOOKED,
    orgId: DEMO_ORG_ID,
    occurredAt: new Date().toISOString(),
    payload: { roomId, roomType: room.type, guestName, checkIn, checkOut },
  });

  return {
    success: true,
    message: `Rum ${roomId} bokat för ${guestName} (${checkIn} → ${checkOut}).`,
    room,
  };
}

export function setCallStatus(onCall: boolean): void {
  const store = getStore();
  store.onCall = onCall;

  addActivity(store, {
    type: onCall ? 'call_started' : 'call_ended',
    message: onCall
      ? 'Inkommande samtal — receptionen är aktiv.'
      : 'Samtalet avslutades.',
  });

  broadcast({ type: 'call_status', payload: { onCall } });
  saveToDisk(store);
}

export function getFullState(): RoomStoreState {
  const store = getStore();
  return {
    rooms: store.rooms.map((r) => ({ ...r })),
    recentActivity: [...store.recentActivity],
    onCall: store.onCall,
  };
}

export function resetRooms(): void {
  const store = getStore();
  store.rooms = INITIAL_ROOMS.map((r) => ({ ...r }));
  store.recentActivity = [];
  store.onCall = false;
  broadcast({ type: 'full_state', payload: getFullState() });
  saveToDisk(store);
}

export function logRoomsQueried(): void {
  const store = getStore();
  addActivity(store, {
    type: 'rooms_queried',
    message: 'Receptionen frågade efter tillgängliga rum.',
  });

  eventBus.publish<RoomQueriedEvent>({
    type: ROOM_QUERIED,
    orgId: DEMO_ORG_ID,
    occurredAt: new Date().toISOString(),
    payload: { availableCount: getAvailableRooms().length },
  });
}

export function logActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): ActivityEvent {
  const store = getStore();
  return addActivity(store, event);
}
