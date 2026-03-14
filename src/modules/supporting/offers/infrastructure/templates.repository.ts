import { prisma }         from '@platform/database/prisma';
import type { OfferTemplate } from '../domain/template.entity';

// ─── I/O types ─────────────────────────────────────────────────────────────────

export interface CreateTemplateInput {
  organizationId: string;
  name:           string;
  content:        string; // TipTap JSON string
  createdBy:      string; // User.id
}

export interface UpdateTemplateInput {
  name?:    string;
  content?: string;
}

// ─── Mapper ────────────────────────────────────────────────────────────────────

function mapTemplate(r: Record<string, unknown>): OfferTemplate {
  return {
    id:             r.id as string,
    organizationId: r.organizationId as string,
    name:           r.name as string,
    content:        r.content as string,
    createdBy:      r.createdBy as string,
    createdAt:      (r.createdAt as Date).toISOString(),
    updatedAt:      (r.updatedAt as Date).toISOString(),
  };
}

const TEMPLATE_SELECT = {
  id: true, organizationId: true, name: true, content: true,
  createdBy: true, createdAt: true, updatedAt: true,
};

// ─── Repository ────────────────────────────────────────────────────────────────

export const templatesRepository = {

  async create(input: CreateTemplateInput): Promise<OfferTemplate> {
    const row = await prisma.offerTemplate.create({
      data: {
        organizationId: input.organizationId,
        name:           input.name,
        content:        input.content,
        createdBy:      input.createdBy,
      },
      select: TEMPLATE_SELECT,
    });
    return mapTemplate(row as unknown as Record<string, unknown>);
  },

  async findById(id: string, orgId: string): Promise<OfferTemplate | null> {
    const row = await prisma.offerTemplate.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: TEMPLATE_SELECT,
    });
    if (!row) return null;
    return mapTemplate(row as unknown as Record<string, unknown>);
  },

  async list(orgId: string): Promise<OfferTemplate[]> {
    const rows = await prisma.offerTemplate.findMany({
      where:   { organizationId: orgId, deletedAt: null },
      select:  TEMPLATE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r: unknown) => mapTemplate(r as Record<string, unknown>));
  },

  async update(id: string, orgId: string, input: UpdateTemplateInput): Promise<OfferTemplate | null> {
    const existing = await prisma.offerTemplate.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!existing) return null;

    const row = await prisma.offerTemplate.update({
      where: { id },
      data: {
        ...(input.name    !== undefined ? { name: input.name }       : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
      },
      select: TEMPLATE_SELECT,
    });
    return mapTemplate(row as unknown as Record<string, unknown>);
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.offerTemplate.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!existing) return false;
    await prisma.offerTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  },
};
