import { eventBus } from '@platform/events';
import { crmLeadRepository } from '../infrastructure/crm-lead.repository';

const LEAD_CREATED = 'leads.lead.created' as const;

export interface CreateVoiceCallLeadInput {
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
}

export async function createVoiceCallLead(
  input: CreateVoiceCallLeadInput,
  actorId = 'system',
): Promise<void> {
  const lead = await crmLeadRepository.createLead({
    ...input,
    source: 'voice_call',
  });

  await crmLeadRepository.addLeadActivity({
    leadId: lead.id,
    organizationId: lead.organizationId,
    type: 'note',
    content: 'Lead created from voice_call.',
    createdBy: actorId,
  });

  eventBus.publish({
    type: LEAD_CREATED,
    orgId: lead.organizationId,
    occurredAt: new Date().toISOString(),
    payload: {
      leadId: lead.id,
      name: lead.name,
      source: lead.source,
      assignedTo: lead.assignedTo,
    },
  });
}
