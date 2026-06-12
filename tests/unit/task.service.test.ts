import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@modules/supporting/identity', () => ({
  organizationHasModule: vi.fn(),
}));

vi.mock('../../src/modules/generic/workforce/infrastructure/task.repository', () => ({
  taskRepository: {
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
  },
}));

vi.mock('@platform/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { organizationHasModule } from '@modules/supporting/identity';
import { taskRepository } from '../../src/modules/generic/workforce/infrastructure/task.repository';
import {
  listChecklistTasks,
  updateChecklistTask,
} from '../../src/modules/generic/workforce/application/task.service';

describe('task service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(organizationHasModule).mockResolvedValue(true);
  });

  it('throws 404 when the task does not belong to the organization', async () => {
    vi.mocked(taskRepository.updateTask).mockResolvedValue(null);

    await expect(
      updateChecklistTask('org_other', 'task_1', 'user_1', { completed: true }),
    ).rejects.toMatchObject({ problem: { status: 404 } });
  });

  it('rejects access when the tasks module is disabled', async () => {
    vi.mocked(organizationHasModule).mockResolvedValue(false);

    await expect(listChecklistTasks('org_1', {})).rejects.toMatchObject({ problem: { status: 403 } });
    expect(taskRepository.listTasks).not.toHaveBeenCalled();
  });
});
