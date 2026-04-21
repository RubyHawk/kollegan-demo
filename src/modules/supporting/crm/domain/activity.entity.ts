import type { CrmContact } from './contact.entity';
import type { RealtimeActivityEvent } from '@shared/realtime/activity.types';

export type CrmActivityEvent = RealtimeActivityEvent<CrmContact>;

export interface CrmActivitySession {
  id: string;
  kind: 'call' | 'standalone';
  events: CrmActivityEvent[];
  startTime: Date;
  endTime?: Date;
  ongoing: boolean;
  confirmed: number;
  cancelled: number;
  locked: number;
  searched: number;
  crmContact?: CrmContact;
}
