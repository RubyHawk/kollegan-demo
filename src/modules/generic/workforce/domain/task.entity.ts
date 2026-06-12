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

export interface CreateChecklistTaskInput {
  title: string;
  area?: string | null;
  dueAt?: string | null;
  assignedToUserId?: string | null;
}

export interface UpdateChecklistTaskInput {
  title?: string;
  area?: string | null;
  dueAt?: string | null;
  assignedToUserId?: string | null;
  completed?: boolean;
}

export interface ListChecklistTasksInput {
  includeCompleted?: boolean;
}
