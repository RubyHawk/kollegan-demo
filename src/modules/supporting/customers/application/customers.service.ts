import { eventBus } from '@platform/events';
import { logger } from '@platform/logging/logger';
import { customersRepository } from '../infrastructure/customers.repository';
import type { Customer, UpdateCustomerInput } from '../domain/customer.entity';
import type { ListCustomersFilter } from '../infrastructure/customers.repository';
import { CUSTOMER_CREATED, CUSTOMER_UPDATED } from '../events/customer.events';

export type { Customer, UpdateCustomerInput, ListCustomersFilter };

const TAG = 'CustomersService';

export interface CustomerOfferSnapshot {
  id: string;
  organizationId: string;
  recipientName: string;
  recipientEmail: string;
  recipientCompany?: string;
  leadId?: string;
}

export async function listCustomers(
  orgId: string,
  filter: ListCustomersFilter,
): Promise<{ customers: Customer[]; total: number }> {
  return customersRepository.list(orgId, filter);
}

export async function getCustomer(id: string, orgId: string): Promise<Customer | null> {
  return customersRepository.findById(id, orgId);
}

export async function createCustomer(
  input: {
    organizationId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
    notes?: string | null;
  },
): Promise<Customer> {
  const customer = await customersRepository.create(input);
  eventBus.publish({
    type: CUSTOMER_CREATED,
    orgId: input.organizationId,
    occurredAt: new Date().toISOString(),
    payload: { customerId: customer.id, name: customer.name, email: customer.email },
  });
  return customer;
}

export async function updateCustomer(
  id: string,
  orgId: string,
  input: UpdateCustomerInput,
): Promise<Customer | null> {
  const customer = await customersRepository.update(id, orgId, input);
  if (!customer) return null;

  eventBus.publish({
    type: CUSTOMER_UPDATED,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: { customerId: id, fields: Object.keys(input) },
  });

  return customer;
}

export async function deleteCustomer(id: string, orgId: string): Promise<boolean> {
  return customersRepository.softDelete(id, orgId);
}

export async function upsertCustomerFromLead(
  leadId: string | undefined,
  offer: CustomerOfferSnapshot,
): Promise<Customer> {
  const orgId = offer.organizationId;
  const lead = leadId ? await customersRepository.getLead(leadId, orgId) : null;
  const email = lead?.email ?? offer.recipientEmail;
  const existing = await customersRepository.findByEmail(orgId, email);

  let customer = existing;
  let created = false;
  if (!customer) {
    customer = await customersRepository.create({
      organizationId: orgId,
      name: lead?.name ?? offer.recipientName,
      email,
      phone: lead?.phone ?? null,
      company: lead?.company ?? offer.recipientCompany ?? null,
      notes: lead?.notes ?? null,
      convertedFromLeadId: lead?.id ?? null,
    });
    created = true;
  }

  if (leadId) {
    await customersRepository.linkLeadToCustomer(leadId, orgId, customer.id);
  }
  await customersRepository.linkOfferToCustomer(offer.id, orgId, customer.id);

  if (created) {
    eventBus.publish({
      type: CUSTOMER_CREATED,
      orgId,
      occurredAt: new Date().toISOString(),
      payload: { customerId: customer.id, name: customer.name, email: customer.email },
    });
  }

  logger.info(TAG, `Customer linked for accepted offer ${offer.id}`, {
    customerId: customer.id,
    leadId,
    created,
  });

  return customer;
}
