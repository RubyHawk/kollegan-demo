import { apiGet, apiPatch, apiPost } from '../api-client';

interface ApiEnvelope<T> {
  data: T;
}

export interface ChecklistTask {
  id: string;
  organizationId: string;
  title: string;
  area: string | null;
  dueAt: string | null;
  assignedToUserId: string | null;
  completedAt: string | null;
  completedBy: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listChecklistTasks(includeCompleted = false): Promise<ChecklistTask[]> {
  const params = new URLSearchParams({ includeCompleted: String(includeCompleted) });
  const res = await apiGet<ApiEnvelope<{ tasks: ChecklistTask[] }>>(`/api/v1/tasks?${params}`);
  return res.data.tasks;
}

export async function createChecklistTask(payload: {
  title: string;
  area?: string | null;
  dueAt?: string | null;
  assignedToUserId?: string | null;
}): Promise<ChecklistTask> {
  const res = await apiPost<ApiEnvelope<{ task: ChecklistTask }>>('/api/v1/tasks', payload);
  return res.data.task;
}

export async function updateChecklistTask(
  id: string,
  payload: {
    title?: string;
    area?: string | null;
    dueAt?: string | null;
    assignedToUserId?: string | null;
    completed?: boolean;
  },
): Promise<ChecklistTask> {
  const res = await apiPatch<ApiEnvelope<{ task: ChecklistTask }>>(`/api/v1/tasks/${id}`, payload);
  return res.data.task;
}
