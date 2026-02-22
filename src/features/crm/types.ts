export interface CRMContact {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  summary?: string;
}

export interface CRMEntry {
  id: string;
  contact: CRMContact;
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
