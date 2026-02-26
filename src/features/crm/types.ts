export interface CrmContact {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  summary?: string;
}

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
