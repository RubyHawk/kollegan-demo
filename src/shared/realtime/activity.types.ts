export type RealtimeActivityType =
  | 'call_started'
  | 'call_ended'
  | 'rooms_queried'
  | 'room_locked'
  | 'room_confirmed'
  | 'room_cancelled'
  | 'crm_contact'
  | 'info';

export interface RealtimeActivityEvent<TMetadata = unknown> {
  id: string;
  timestamp: string;
  type: RealtimeActivityType;
  message: string;
  roomId?: string;
  metadata?: TMetadata;
}
