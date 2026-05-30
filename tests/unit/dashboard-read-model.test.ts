import { describe, expect, it } from 'vitest';
import { buildDashboardReadModel } from '../../src/modules/generic/dashboard/application/dashboard-read-model.service';
import type { DashboardSnapshot } from '../../src/modules/generic/dashboard/infrastructure/dashboard-read-model.repository';
import type { DashboardCalendar, DashboardWeather } from '../../src/modules/generic/dashboard';

const now = new Date('2026-05-30T10:00:00.000Z');

function snapshot(overrides: Partial<DashboardSnapshot> = {}): DashboardSnapshot {
  return {
    countMap: { draft: 1, sent: 1, viewed: 1, accepted: 1, declined: 0, expired: 0 },
    valueMap: { draft: 10_000, sent: 50_000, viewed: 35_000, accepted: 120_000 },
    total: 4,
    acceptedValue: 120_000,
    pipelineValue: 85_000,
    acceptanceRate: 100,
    expiringSoon: 1,
    projectStats: {
      total: 1,
      active: 1,
      completed: 0,
      stages: { details: 1, ordered: 0, arrived: 0, in_progress: 0, completed: 0 },
    },
    activityData: [],
    meetingsToday: [],
    projectHandoffs: [],
    recentOffers: [
      {
        id: 'offer_overdue',
        title: 'Ring Eriksson',
        status: 'sent',
        offerNumber: 2456,
        recipientName: null,
        recipientCompany: 'Eriksson AB',
        totalIncVat: 50_000,
        createdAt: '2026-05-20T08:00:00.000Z',
        updatedAt: '2026-05-20T08:00:00.000Z',
        validUntil: '2026-05-28T22:00:00.000Z',
        sentAt: '2026-05-20T08:00:00.000Z',
        viewedAt: null,
        acceptedAt: null,
        declinedAt: null,
        reminderSentAt: null,
        project: null,
      },
      {
        id: 'offer_viewed',
        title: 'Följ upp',
        status: 'viewed',
        offerNumber: 2455,
        recipientName: 'Anna Svensson',
        recipientCompany: 'Svensson Bygg AB',
        totalIncVat: 35_000,
        createdAt: '2026-05-24T08:00:00.000Z',
        updatedAt: '2026-05-24T08:00:00.000Z',
        validUntil: '2026-06-02T22:00:00.000Z',
        sentAt: '2026-05-24T08:00:00.000Z',
        viewedAt: '2026-05-25T08:00:00.000Z',
        acceptedAt: null,
        declinedAt: null,
        reminderSentAt: null,
        project: null,
      },
    ],
    ...overrides,
  };
}

const calendar: DashboardCalendar = {
  configured: false,
  error: null,
  events: [],
};

const weather: DashboardWeather = {
  status: 'unavailable',
  locationName: 'Örebro',
  temperatureC: null,
  windSpeed: null,
  humidity: null,
  symbolCode: null,
  conditionLabel: 'Väderdata saknas',
  updatedAt: null,
  forecast: [],
};

describe('dashboard read model derivations', () => {
  it('builds prioritized action items and offer table deadlines from real offer dates', () => {
    const model = buildDashboardReadModel(snapshot(), { calendar, weather }, now);

    expect(model.focusMetrics.overdue).toBe(1);
    expect(model.focusMetrics.missingFollowUp).toBe(2);
    expect(model.actionItems[0]).toMatchObject({
      id: 'overdue-offer_overdue',
      tone: 'danger',
      label: 'Ring Eriksson AB',
      detail: 'Offert #2456 · över deadline · 50 tkr',
      actionLabel: 'Ring nu',
    });
    expect(model.offerTable[0]).toMatchObject({
      id: 'offer_overdue',
      deadlineLabel: 'Över deadline',
      nextStep: 'Följ upp idag',
      displayCustomerName: 'Eriksson AB',
      displaySubtitle: 'Offert #2456 · Skickad',
      displayAmount: '50 tkr',
      displayRiskLabel: 'Över deadline',
      displayNextAction: 'Följ upp idag',
    });
  });

  it('merges configured calendar events with local meetings and selects the next meeting', () => {
    const model = buildDashboardReadModel(
      snapshot({
        meetingsToday: [{
          id: 'meeting_local',
          title: 'Lokalt projektmöte',
          scheduledAt: '2026-05-30T12:00:00.000Z',
          endedAt: null,
        }],
      }),
      {
        calendar: {
          configured: true,
          error: null,
          events: [{
            id: 'google_1',
            title: 'Google-synk',
            start: '2026-05-30T11:00:00.000Z',
            end: '2026-05-30T11:30:00.000Z',
            allDay: false,
            source: 'google',
          }],
        },
        weather,
      },
      now,
    );

    expect(model.calendar.configured).toBe(true);
    expect(model.focusMetrics.meetingsToday).toBe(2);
    expect(model.today.nextMeeting?.title).toBe('Google-synk');
  });
});
