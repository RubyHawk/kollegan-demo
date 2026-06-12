import { Errors } from '@platform/api/errors';
import { logger } from '@platform/logging/logger';
import { organizationHasModule } from '@modules/supporting/identity';
import { taskRepository } from '../infrastructure/task.repository';
import type {
  CreateChecklistTaskInput,
  ListChecklistTasksInput,
  UpdateChecklistTaskInput,
} from '../domain/task.entity';

const TAG = 'TaskService';

async function requireTasksModule(organizationId: string) {
  const enabled = await organizationHasModule(organizationId, 'tasks');
  if (!enabled) throw Errors.forbidden('Tasks module is not enabled for this organization');
}

export async function listChecklistTasks(organizationId: string, input: ListChecklistTasksInput) {
  await requireTasksModule(organizationId);
  return taskRepository.listTasks(organizationId, input);
}

export async function createChecklistTask(
  organizationId: string,
  actorId: string,
  input: CreateChecklistTaskInput,
) {
  await requireTasksModule(organizationId);
  const task = await taskRepository.createTask(organizationId, actorId, input);
  logger.info(TAG, 'Checklist task created', { organizationId, actorId, taskId: task.id });
  return task;
}

export async function updateChecklistTask(
  organizationId: string,
  id: string,
  actorId: string,
  input: UpdateChecklistTaskInput,
) {
  await requireTasksModule(organizationId);
  const task = await taskRepository.updateTask(organizationId, id, actorId, input);
  if (!task) throw Errors.notFound('Checklist task not found');

  logger.info(TAG, 'Checklist task updated', { organizationId, actorId, taskId: id });
  return task;
}
