import { prisma } from '@platform/database/prisma';

export interface CreateCrmLeadInput {
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  source: 'voice_call';
}

export interface CreateCrmLeadActivityInput {
  leadId: string;
  organizationId: string;
  type: 'note';
  content: string;
  createdBy: string;
}

export const crmLeadRepository = {
  async createLead(input: CreateCrmLeadInput): Promise<{
    id: string;
    organizationId: string;
    name: string;
    source: string;
    assignedTo: string | null;
  }> {
    return prisma.lead.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        company: input.company ?? null,
        notes: input.notes ?? null,
        source: input.source,
        status: 'new',
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        source: true,
        assignedTo: true,
      },
    });
  },

  async addLeadActivity(input: CreateCrmLeadActivityInput): Promise<void> {
    await prisma.leadActivity.create({
      data: {
        leadId: input.leadId,
        organizationId: input.organizationId,
        type: input.type,
        content: input.content,
        createdBy: input.createdBy,
      },
    });
  },
};
