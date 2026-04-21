export interface SSEMessage<TPayload = unknown> {
  type: 'room_update' | 'activity' | 'call_status' | 'full_state';
  payload: TPayload;
}
