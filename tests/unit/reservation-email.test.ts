import { describe, expect, it } from 'vitest';
import { buildReservationEmailCopy } from '../../src/modules/supporting/restaurant-menu/application/reservation-email';

const base = {
  to: 'guest@example.com',
  guestName: 'Alex',
  partySize: 2,
  requestedAt: '2026-06-20T17:00:00.000Z',
  restaurantName: "Fluffy's",
  restaurantPhone: '+46 8 000 00 00',
  senderEmail: 'bokning@fluffys.se',
};

describe('buildReservationEmailCopy', () => {
  it('confirms a booking with the party size and restaurant name', () => {
    const copy = buildReservationEmailCopy({ ...base, kind: 'confirmed' });
    expect(copy.subject.toLowerCase()).toContain('bekräftad');
    expect(copy.body).toContain('2 personer');
    expect(copy.body).toContain("Fluffy's");
  });

  it('acknowledges a received request', () => {
    const copy = buildReservationEmailCopy({ ...base, kind: 'received' });
    expect(copy.body).toContain('tagit emot');
    expect(copy.body).toContain('återkommer');
  });

  it('uses the singular "person" for a party of one', () => {
    const copy = buildReservationEmailCopy({ ...base, kind: 'received', partySize: 1 });
    expect(copy.body).toContain('1 person ');
    expect(copy.body).not.toContain('1 personer');
  });

  it('declines with the phone number when present and a generic line otherwise', () => {
    expect(buildReservationEmailCopy({ ...base, kind: 'declined' }).body).toContain('+46 8 000 00 00');
    expect(buildReservationEmailCopy({ ...base, kind: 'declined', restaurantPhone: null }).body).toContain('Hör gärna av dig');
  });
});
