import { prisma } from '@platform/database/prisma';
import type {
  ChecklistTask,
  CreateChecklistTaskInput,
  ListChecklistTasksInput,
  UpdateChecklistTaskInput,
} from '../domain/task.entity';

type TaskRow = {
  id: string;
  organizationId: string;
  title: string;
  area: string | null;
  dueAt: Date | null;
  assignedToUserId: string | null;
  completedAt: Date | null;
  completedBy: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapTask(row: TaskRow): ChecklistTask {
  return {
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    area: row.area,
    dueAt: row.dueAt?.toISOString() ?? null,
    assignedToUserId: row.assignedToUserId,
    completedAt: row.completedAt?.toISOString() ?? null,
    completedBy: row.completedBy,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const taskRepository = {
  async listTasks(organizationId: string, input: ListChecklistTasksInput): Promise<ChecklistTask[]> {
    const rows = await prisma.checklistTask.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(input.includeCompleted ? {} : { completedAt: null }),
      },
      orderBy: [{ completedAt: 'asc' }, { dueAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
      take: 200,
    });
    return rows.map((row) => mapTask(row as TaskRow));
  },

  async createTask(
    organizationId: string,
    createdBy: string,
    input: CreateChecklistTaskInput,
  ): Promise<ChecklistTask> {
    const row = await prisma.checklistTask.create({
      data: {
        organizationId,
        title: input.title,
        area: input.area ?? null,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        assignedToUserId: input.assignedToUserId ?? null,
        createdBy,
      },
    });
    return mapTask(row as TaskRow);
  },

  async updateTask(
    organizationId: string,
    id: string,
    actorId: string,
    input: UpdateChecklistTaskInput,
  ): Promise<ChecklistTask | null> {
    const existing = await prisma.checklistTask.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.checklistTask.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.area !== undefined ? { area: input.area } : {}),
        ...(input.dueAt !== undefined ? { dueAt: input.dueAt ? new Date(input.dueAt) : null } : {}),
        ...(input.assignedToUserId !== undefined ? { assignedToUserId: input.assignedToUserId } : {}),
        ...(input.completed !== undefined
          ? input.completed
            ? { completedAt: new Date(), completedBy: actorId }
            : { completedAt: null, completedBy: null }
          : {}),
      },
    });
    return mapTask(row as TaskRow);
  },
};
