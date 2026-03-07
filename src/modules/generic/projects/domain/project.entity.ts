/**
 * Projects Module — Domain Types
 *
 * Covers project management with task tracking.
 *
 * Models:
 *  - Project: organizational project with status, priority, progress
 *  - ProjectTask: individual tasks within a project
 */

export type ProjectStatus = 'active' | 'review' | 'planned' | 'done' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: string;
  assigneeId: string | null;
  dueDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  ownerId: string | null;
  dueDate: string | null;
  startDate: string | null;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tasks?: ProjectTask[];
  taskCount?: number;
  tasksDone?: number;
}
