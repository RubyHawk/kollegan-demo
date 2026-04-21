import { registerTool } from '@modules/core/automation/tools/registry';
import { lookupCustomer, updateCrm } from './crm.service';
import { upsertCustomer } from '../infrastructure/contact.repository';

export function registerCrmVoiceTools(): void {
  registerTool({
    name: 'crm.lookup_customer',
    description: 'Look up an existing customer profile by phone number or name.',
    fn: async (args) => {
      const { phone, name } = args as { phone?: string; name?: string };
      return lookupCustomer({ phone, name });
    },
  });

  registerTool({
    name: 'crm.upsert_customer',
    description: 'Create or update a customer profile. Uses phone as the unique key when available.',
    fn: async (args) => upsertCustomer(args as Parameters<typeof upsertCustomer>[0]),
  });

  registerTool({
    name: 'crm.update_record',
    description:
      'Create a CRM record for a completed call session, linking booked rooms, the customer profile, and the Vapi transcript.',
    fn: async (args) => updateCrm(args as Parameters<typeof updateCrm>[0]),
  });
}
