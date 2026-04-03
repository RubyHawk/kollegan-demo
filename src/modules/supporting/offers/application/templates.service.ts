import { logger }              from '@platform/logging/logger';
import { templatesRepository } from '../infrastructure/templates.repository';
import type { OfferTemplate }  from '../domain/template.entity';
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
} from '../infrastructure/templates.repository';

export type { CreateTemplateInput, UpdateTemplateInput };

const TAG = 'TemplatesService';

export async function createTemplate(
  input: Omit<CreateTemplateInput, 'createdBy'>,
  actorId: string,
): Promise<OfferTemplate> {
  const template = await templatesRepository.create({ ...input, createdBy: actorId });
  logger.info(TAG, `Template created: ${template.name}`, { templateId: template.id });
  return template;
}

export async function getTemplate(id: string, orgId: string): Promise<OfferTemplate | null> {
  return templatesRepository.findById(id, orgId);
}

export async function listTemplates(orgId: string, companyId?: string): Promise<OfferTemplate[]> {
  return templatesRepository.list(orgId, companyId);
}

export async function updateTemplate(
  id: string,
  orgId: string,
  input: UpdateTemplateInput,
): Promise<OfferTemplate | null> {
  const updated = await templatesRepository.update(id, orgId, input);
  if (updated) logger.info(TAG, `Template updated: ${id}`);
  return updated;
}

export async function deleteTemplate(id: string, orgId: string): Promise<boolean> {
  const deleted = await templatesRepository.softDelete(id, orgId);
  if (deleted) logger.info(TAG, `Template deleted: ${id}`);
  return deleted;
}
