import { eventBus } from '@platform/events';
import { logger } from '@platform/logging/logger';
import { getLineExVat, getLineIncVat, type Offer, type OfferLineItem } from '@modules/supporting/offers';
import { projectsRepository } from '../infrastructure/projects.repository';
import type { ListProjectsFilter } from '../infrastructure/projects.repository';
import type { InstallDetails, Project, ProjectStage } from '../domain/project.entity';
import { validateStageTransition } from '../domain/stage-machine';
import { PROJECT_COMPLETED, PROJECT_CREATED, PROJECT_STAGE_ADVANCED } from '../events/project.events';

export type { InstallDetails, Project, ProjectLineItem, ProjectStage, ProjectStageEvent } from '../domain/project.entity';
export type { ListProjectsFilter };

const TAG = 'ProjectsService';

function lineUnit(item: OfferLineItem): string {
  return ((item as OfferLineItem & { unit?: string | null }).unit ?? '').trim() || 'st';
}

function lineProductId(item: OfferLineItem): string | null {
  return (item as OfferLineItem & { productId?: string | null }).productId ?? null;
}

function snapshotLineItem(item: OfferLineItem, idx: number) {
  return {
    sourceOfferLineItemId: item.id,
    sourceProductId: lineProductId(item),
    productName: item.description.split('\n')[0]?.slice(0, 180) || item.description,
    description: item.description,
    quantity: item.quantity,
    unit: lineUnit(item),
    unitPrice: item.unitPrice,
    vatRate: item.vatRate,
    discount: item.discount ?? 0,
    lineTotalExVat: getLineExVat(item),
    lineTotalIncVat: getLineIncVat(item),
    sortOrder: item.sortOrder ?? idx,
  };
}

export async function createProjectFromOffer(offerId: string, orgId: string): Promise<Project> {
  const existing = await projectsRepository.findByOfferId(offerId, orgId);
  if (existing) return existing;

  const { getOffer } = await import('@modules/supporting/offers');
  const { upsertCustomerFromLead } = await import('@modules/supporting/customers');
  const offer = await getOffer(offerId, orgId) as Offer | null;
  if (!offer) throw Object.assign(new Error('Offer not found'), { code: 'OFFER_NOT_FOUND' });
  if (offer.status !== 'accepted') throw Object.assign(new Error('Offer is not accepted'), { code: 'OFFER_NOT_ACCEPTED' });

  const customer = await upsertCustomerFromLead(offer.leadId, {
    id: offer.id,
    organizationId: offer.organizationId,
    recipientName: offer.recipientName,
    recipientEmail: offer.recipientEmail,
    recipientCompany: offer.recipientCompany,
    leadId: offer.leadId,
  });

  let project: Project;
  try {
    project = await projectsRepository.createFromOffer({
      organizationId: orgId,
      customerId: customer.id,
      offerId: offer.id,
      name: offer.title || `Projekt - ${customer.name}`,
      offerNumber: offer.offerNumber ?? null,
      offerAcceptedAt: offer.acceptedAt ? new Date(offer.acceptedAt) : new Date(),
      priceDisplayMode: offer.priceDisplayMode,
      totalExVat: offer.totalExVat,
      totalIncVat: offer.totalIncVat,
      createdBy: offer.createdBy,
      lineItems: offer.lineItems.map(snapshotLineItem),
    });
  } catch (err) {
    const racedProject = await projectsRepository.findByOfferId(offerId, orgId);
    if (racedProject) return racedProject;
    throw err;
  }

  eventBus.publish({
    type: PROJECT_CREATED,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: { projectId: project.id, offerId: offer.id, customerId: customer.id, name: project.name },
  });

  logger.info(TAG, `Project created from accepted offer ${offerId}`, { projectId: project.id, orgId });
  return project;
}

export async function backfillProjectsFromAcceptedOffers(orgId: string): Promise<number> {
  const offerIds = await projectsRepository.findAcceptedOfferIdsWithoutProjects(orgId);
  let created = 0;

  for (const offerId of offerIds) {
    try {
      const before = await projectsRepository.findByOfferId(offerId, orgId);
      await createProjectFromOffer(offerId, orgId);
      if (!before) created += 1;
    } catch (err) {
      logger.warn(TAG, 'Failed to backfill project from accepted offer', { offerId, orgId, err });
    }
  }

  if (created > 0) {
    logger.info(TAG, `Backfilled ${created} projects from accepted offers`, { orgId });
  }

  return created;
}

export async function listProjects(
  orgId: string,
  filter: ListProjectsFilter,
): Promise<{ projects: Project[]; total: number }> {
  return projectsRepository.list(orgId, filter);
}

export async function countProjects(
  orgId: string,
  filter: Pick<ListProjectsFilter, 'search' | 'customerId'>,
): Promise<Record<ProjectStage, number>> {
  return projectsRepository.counts(orgId, filter);
}

export async function backfillAllOrganizations(): Promise<number> {
  const orgIds = await projectsRepository.findOrgsWithPendingBackfill(50);
  let total = 0;
  for (const orgId of orgIds) {
    total += await backfillProjectsFromAcceptedOffers(orgId);
  }
  return total;
}

export async function getProject(id: string, orgId: string): Promise<Project | null> {
  return projectsRepository.findById(id, orgId);
}

export async function updateProjectDetails(
  projectId: string,
  orgId: string,
  installDetails: InstallDetails,
): Promise<Project | null> {
  return projectsRepository.updateDetails(projectId, orgId, installDetails);
}

export async function advanceProjectStage(
  projectId: string,
  orgId: string,
  toStage: ProjectStage,
  actorId: string,
): Promise<Project | null> {
  const project = await projectsRepository.findById(projectId, orgId);
  if (!project) return null;

  const blockingReason = validateStageTransition(project, toStage);
  if (blockingReason) {
    throw Object.assign(new Error(blockingReason), { code: 'STAGE_BLOCKED' });
  }

  const fromStage = project.stage;
  const updated = await projectsRepository.advanceStage(projectId, orgId, toStage, actorId);
  if (!updated) return null;

  eventBus.publish({
    type: PROJECT_STAGE_ADVANCED,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: { projectId, fromStage, toStage, actorId },
  });

  if (toStage === 'completed') {
    eventBus.publish({
      type: PROJECT_COMPLETED,
      orgId,
      occurredAt: new Date().toISOString(),
      payload: { projectId, name: updated.name, actorId },
    });
  }

  return updated;
}
