import { prisma } from '@platform/database/prisma';
import type { Project, ProjectTask } from '../domain/project.entity';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CreateProjectInput {
  organizationId: string;
  name:           string;
  description?:   string;
  status:         string;
  priority:       string;
  progress:       number;
  ownerId?:       string;
  dueDate?:       Date;
  startDate?:     Date;
  tags:           string[];
}

export interface CreateProjectData extends CreateProjectInput {
  createdBy: string;
}

export interface UpdateProjectInput {
  name?:        string;
  description?: string | null;
  status?:      string;
  priority?:    string;
  progress?:    number;
  ownerId?:     string | null;
  dueDate?:     Date | null;
  startDate?:   Date | null;
  tags?:        string[];
}

export interface ListProjectsFilter {
  status?:  string;
  search?:  string;
  limit?:   number;
  offset?:  number;
}

// ─── Mappers ───────────────────────────────────────────────────────────────────

function mapTask(r: Record<string, unknown>): ProjectTask {
  return {
    id:          r.id as string,
    projectId:   r.projectId as string,
    title:       r.title as string,
    description: (r.description as string | null) ?? null,
    status:      r.status as ProjectTask['status'],
    priority:    r.priority as string,
    assigneeId:  (r.assigneeId as string | null) ?? null,
    dueDate:     r.dueDate ? (r.dueDate as Date).toISOString() : null,
    sortOrder:   r.sortOrder as number,
    createdAt:   (r.createdAt as Date).toISOString(),
    updatedAt:   (r.updatedAt as Date).toISOString(),
    completedAt: r.completedAt ? (r.completedAt as Date).toISOString() : null,
  };
}

function mapProject(r: Record<string, unknown>): Project {
  const tasks = r.tasks as Record<string, unknown>[] | undefined;

  const base: Project = {
    id:             r.id as string,
    organizationId: r.organizationId as string,
    name:           r.name as string,
    description:    (r.description as string | null) ?? null,
    status:         r.status as Project['status'],
    priority:       r.priority as Project['priority'],
    progress:       r.progress as number,
    ownerId:        (r.ownerId as string | null) ?? null,
    dueDate:        r.dueDate   ? (r.dueDate   as Date).toISOString() : null,
    startDate:      r.startDate ? (r.startDate as Date).toISOString() : null,
    tags:           r.tags as string[],
    createdBy:      r.createdBy as string,
    createdAt:      (r.createdAt as Date).toISOString(),
    updatedAt:      (r.updatedAt as Date).toISOString(),
  };

  if (tasks) {
    base.tasks = tasks.map(mapTask);
  }

  return base;
}

function mapProjectWithCounts(r: Record<string, unknown>): Project {
  const tasks = (r.tasks as Array<{ id: string; status: string }>) ?? [];
  const project = mapProject(r);
  project.taskCount = tasks.length;
  project.tasksDone = tasks.filter((t) => t.status === 'done').length;
  // Remove full task objects for list view — only counts
  project.tasks = undefined;
  return project;
}

// ─── Repository ────────────────────────────────────────────────────────────────

export const projectRepository = {

  async create(input: CreateProjectData): Promise<Project> {
    const row = await prisma.project.create({
      data: {
        organizationId: input.organizationId,
        name:           input.name,
        description:    input.description ?? null,
        status:         input.status,
        priority:       input.priority,
        progress:       input.progress,
        ownerId:        input.ownerId ?? null,
        dueDate:        input.dueDate   ?? null,
        startDate:      input.startDate ?? null,
        tags:           input.tags,
        createdBy:      input.createdBy,
      },
    });
    return mapProject(row as unknown as Record<string, unknown>);
  },

  async findById(id: string, orgId: string): Promise<Project | null> {
    const row = await prisma.project.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: {
        tasks: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!row) return null;
    return mapProject(row as unknown as Record<string, unknown>);
  },

  async list(
    orgId: string,
    filter: ListProjectsFilter,
  ): Promise<{ projects: Project[]; total: number }> {
    const where: Record<string, unknown> = {
      organizationId: orgId,
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search ? {
        OR: [
          { name:        { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take:  filter.limit  ?? 50,
        skip:  filter.offset ?? 0,
        include: {
          tasks: { where: { deletedAt: null }, select: { id: true, status: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects: (rows as unknown as Record<string, unknown>[]).map(mapProjectWithCounts),
      total,
    };
  },

  async update(id: string, orgId: string, input: UpdateProjectInput): Promise<Project | null> {
    const existing = await prisma.project.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!existing) return null;

    const row = await prisma.project.update({
      where: { id },
      data: {
        ...(input.name        !== undefined ? { name: input.name }               : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status      !== undefined ? { status: input.status }           : {}),
        ...(input.priority    !== undefined ? { priority: input.priority }       : {}),
        ...(input.progress    !== undefined ? { progress: input.progress }       : {}),
        ...(input.ownerId     !== undefined ? { ownerId: input.ownerId }         : {}),
        ...(input.dueDate     !== undefined ? { dueDate: input.dueDate }         : {}),
        ...(input.startDate   !== undefined ? { startDate: input.startDate }     : {}),
        ...(input.tags        !== undefined ? { tags: input.tags }               : {}),
      },
    });
    return mapProject(row as unknown as Record<string, unknown>);
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.project.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!existing) return false;
    await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  },
};
