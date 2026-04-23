import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@shared/lib/api/announcements.api', () => ({
  listAnnouncements: vi.fn(),
}));

vi.mock('@shared/lib/api/customers.api', () => ({
  listCustomers: vi.fn(),
}));

vi.mock('@shared/lib/api/leads.api', () => ({
  listLeads: vi.fn(),
}));

vi.mock('@shared/lib/api/meetings.api', () => ({
  listMeetings: vi.fn(),
}));

vi.mock('@shared/lib/api/offers.api', () => ({
  listOffers: vi.fn(),
}));

vi.mock('@shared/lib/api/projects.api', () => ({
  listProjects: vi.fn(),
}));

import { listAnnouncements } from '@shared/lib/api/announcements.api';
import { listCustomers } from '@shared/lib/api/customers.api';
import { listLeads } from '@shared/lib/api/leads.api';
import { listMeetings } from '@shared/lib/api/meetings.api';
import { listOffers } from '@shared/lib/api/offers.api';
import { listProjects } from '@shared/lib/api/projects.api';
import {
  loadAnnouncementsReportRows,
  loadContactsReportRows,
  loadLeadsReportRows,
  loadMeetingsReportRows,
  loadOffersReportRows,
  loadProjectsReportRows,
} from '@shared/lib/api/reports.api';

function row(id: string, extra: Record<string, unknown> = {}) {
  return { id, ...extra } as Record<string, unknown>;
}

describe('reports api loaders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses customer contacts for the contacts export', async () => {
    vi.mocked(listCustomers).mockResolvedValue({
      contacts: [row('contact_1', { name: 'Ada' })] as never[],
      customers: [row('customer_1', { name: 'Ada AB' })] as never[],
      total: 1,
      limit: 1000,
      offset: 0,
    });

    await expect(loadContactsReportRows()).resolves.toEqual([{ id: 'contact_1', name: 'Ada' }]);
    expect(listCustomers).toHaveBeenCalledWith({ limit: 1000, offset: 0 });
  });

  it('falls back to customers when no contact rows are returned', async () => {
    vi.mocked(listCustomers).mockResolvedValue({
      contacts: [],
      customers: [row('customer_1', { name: 'Ada AB' })] as never[],
      total: 1,
      limit: 1000,
      offset: 0,
    });

    await expect(loadContactsReportRows()).resolves.toEqual([{ id: 'customer_1', name: 'Ada AB' }]);
  });

  it('loads leads, offers, projects, meetings, and announcements through feature API clients', async () => {
    vi.mocked(listLeads).mockResolvedValue({ leads: [row('lead_1')] as never[], total: 1, limit: 1000, offset: 0 });
    vi.mocked(listOffers).mockResolvedValue({ offers: [row('offer_1')] as never[], total: 1, limit: 1000, offset: 0 });
    vi.mocked(listProjects).mockResolvedValue({ projects: [row('project_1')] as never[], total: 1, limit: 1000, offset: 0 });
    vi.mocked(listMeetings).mockResolvedValue({ meetings: [row('meeting_1')] as never[], total: 1 });
    vi.mocked(listAnnouncements).mockResolvedValue({ announcements: [row('announcement_1')] as never[], total: 1 });

    await expect(loadLeadsReportRows()).resolves.toEqual([{ id: 'lead_1' }]);
    await expect(loadOffersReportRows()).resolves.toEqual([{ id: 'offer_1' }]);
    await expect(loadProjectsReportRows()).resolves.toEqual([{ id: 'project_1' }]);
    await expect(loadMeetingsReportRows()).resolves.toEqual([{ id: 'meeting_1' }]);
    await expect(loadAnnouncementsReportRows()).resolves.toEqual([{ id: 'announcement_1' }]);

    expect(listLeads).toHaveBeenCalledWith({ limit: 1000, offset: 0 });
    expect(listOffers).toHaveBeenCalledWith({ limit: 1000, offset: 0 });
    expect(listProjects).toHaveBeenCalledWith({ limit: 1000, offset: 0 });
    expect(listMeetings).toHaveBeenCalledWith({ limit: 100, offset: 0 });
    expect(listAnnouncements).toHaveBeenCalledWith({ limit: 100, offset: 0 });
  });
});
