export interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: string;
}

export interface UsageStat {
  label: string;
  used: number;
  limit: number;
}

export const PLAN = {
  name: 'Soleria Pro',
  price: '4 990 kr / månad',
  billing: 'Faktureras månadsvis',
  status: 'Aktiv',
} as const;

export const USAGE_STATS: UsageStat[] = [
  { label: 'AI-samtal', used: 1284, limit: 2000 },
  { label: 'Aktiva demo', used: 1, limit: 3 },
  { label: 'Användare', used: 4, limit: 10 },
];

export const PAYMENT_METHOD = {
  last4: '4242',
  expires: '12/28',
} as const;

export const INVOICES: Invoice[] = [
  { id: 'INV-2026-03', date: '2026-03-01', amount: '4 990 kr', status: 'Betald' },
  { id: 'INV-2026-02', date: '2026-02-01', amount: '4 990 kr', status: 'Betald' },
  { id: 'INV-2026-01', date: '2026-01-01', amount: '4 990 kr', status: 'Betald' },
  { id: 'INV-2025-12', date: '2025-12-01', amount: '4 990 kr', status: 'Betald' },
];
