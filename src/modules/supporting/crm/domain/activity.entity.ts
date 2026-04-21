import type { CrmContact } from './contact.entity';

export interface CrmActivityEvent {
  id: string;
  timestamp: string;
  type:
    | 'call_started'
    | 'call_ended'
    | 'rooms_queried'
    | 'room_locked'
    | 'room_confirmed'
    | 'room_cancelled'
    | 'crm_contact'
    | 'info';
  message: string;
  roomId?: string;
  metadata?: CrmContact;
}

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
