import { listAnnouncements } from './announcements.api';
import { listCustomers } from './customers.api';
import { listLeads } from './leads.api';
import { listMeetings } from './meetings.api';
import { listOffers } from './offers.api';
import { listProjects } from './projects.api';

export type ReportRows = Record<string, unknown>[];
export type ReportRowsLoader = () => Promise<ReportRows>;

function asRows(rows: unknown[]): ReportRows {
  return rows as ReportRows;
}

export async function loadContactsReportRows(): Promise<ReportRows> {
  const data = await listCustomers({ limit: 1000, offset: 0 });
  return asRows(data.contacts.length > 0 ? data.contacts : data.customers);
}

export async function loadLeadsReportRows(): Promise<ReportRows> {
  const data = await listLeads({ limit: 1000, offset: 0 });
  return asRows(data.leads);
}

export async function loadOffersReportRows(): Promise<ReportRows> {
  const data = await listOffers({ limit: 1000, offset: 0 });
  return asRows(data.offers);
}

export async function loadProjectsReportRows(): Promise<ReportRows> {
  const data = await listProjects({ limit: 1000, offset: 0 });
  return asRows(data.projects);
}

export async function loadMeetingsReportRows(): Promise<ReportRows> {
  const data = await listMeetings({ limit: 100, offset: 0 });
  return asRows(data.meetings);
}

export async function loadAnnouncementsReportRows(): Promise<ReportRows> {
  const data = await listAnnouncements({ limit: 100, offset: 0 });
  return asRows(data.announcements);
}
