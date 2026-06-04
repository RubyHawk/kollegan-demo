export type { Customer, CustomerInput, UpdateCustomerInput } from './domain/customer.entity';
export {
  getCustomer,
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
  findOrCreateCustomerForLeadIntake,
  upsertCustomerFromLead,
} from './application/customers.service';
export type { CustomerOfferSnapshot, LeadIntakeCustomerInput, ListCustomersFilter } from './application/customers.service';
export { CUSTOMER_CREATED, CUSTOMER_UPDATED } from './events/customer.events';
export type { CustomerEvent, CustomerCreatedEvent, CustomerUpdatedEvent } from './events/customer.events';
export {
  handleListCustomers,
  handleCreateCustomer,
  handleDeleteCustomer,
  handleGetCustomer,
  handleUpdateCustomer,
} from './api/handlers/customer.handler';
