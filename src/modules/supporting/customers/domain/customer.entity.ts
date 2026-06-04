export interface Customer {
  id: string;
  organizationId: string;
  companyId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  normalizedPhone: string | null;
  company: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  convertedFromLeadId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInput {
  organizationId: string;
  companyId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  normalizedPhone?: string | null;
  company?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  convertedFromLeadId?: string | null;
}

export interface UpdateCustomerInput {
  companyId?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  normalizedPhone?: string | null;
  company?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
}
