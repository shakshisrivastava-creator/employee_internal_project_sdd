import { InMemoryDatabase } from '../../../shared/db/inMemoryDb';
import {
  AuthUser,
  DownstreamTaskEntity,
  DownstreamTaskStatus,
  DownstreamTaskType,
  TransferStatus,
  UserRole
} from '../../../shared/types';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError
} from '../../../shared/errors/AppError';

export class OrchestrationService {
  constructor(private db: InMemoryDatabase) {}

  public updateTaskStatus(
    taskId: string,
    specialist: AuthUser,
    status: DownstreamTaskStatus,
    notes?: string
  ): DownstreamTaskEntity {
    const task = this.db.getTaskById(taskId);
    if (!task) {
      throw new NotFoundError(`Task ${taskId} not found.`);
    }

    // Role permission check
    const isHR = specialist.role === UserRole.HR_ADMIN;
    const isMatchingRole = task.assignedRole === specialist.role;
    if (!isHR && !isMatchingRole) {
      throw new ForbiddenError(
        `User with role ${specialist.role} cannot update ${task.taskType} task.`
      );
    }

    // Failure notes validation: min 10 chars
    if (status === DownstreamTaskStatus.FAILED) {
      if (!notes || notes.trim().length < 10) {
        throw new ValidationError(
          'Notes explaining the failure reason must be at least 10 characters.',
          [{ field: 'notes', message: 'Failure notes must be at least 10 characters.' }]
        );
      }
    }

    // Update the task
    const updatedTask = this.db.updateTask(taskId, {
      status,
      notes: notes || task.notes
    });

    // Check parent transfer completion (AC09)
    const allTasks = this.db.getTasksByTransfer(task.transferRequestId);
    const allTerminal = allTasks.every(
      (t) =>
        t.status === DownstreamTaskStatus.COMPLETED ||
        t.status === DownstreamTaskStatus.FAILED
    );

    const allCompleted = allTasks.every(
      (t) => t.status === DownstreamTaskStatus.COMPLETED
    );

    if (allTasks.length === 3 && allCompleted) {
      this.db.updateTransfer(
        task.transferRequestId,
        { status: TransferStatus.COMPLETED },
        undefined,
        specialist.id,
        specialist.role,
        'ALL_DOWNSTREAM_TASKS_COMPLETED'
      );
    }

    return updatedTask;
  }

  public checkAndFlagSlaBreaches(): number {
    const now = new Date();
    let count = 0;

    // Inspect tasks across the DB
    const allTasks = [
      ...this.db.getTasksByRole(UserRole.IT_SPECIALIST),
      ...this.db.getTasksByRole(UserRole.PAYROLL_SPECIALIST),
      ...this.db.getTasksByRole(UserRole.FACILITIES_SPECIALIST)
    ];

    for (const t of allTasks) {
      const isPending =
        t.status === DownstreamTaskStatus.PENDING ||
        t.status === DownstreamTaskStatus.IN_PROGRESS;

      if (isPending && new Date(t.slaDeadline) < now && !t.slaBreached) {
        this.db.updateTask(t.id, { slaBreached: true });
        count++;
      }
    }

    return count;
  }

  public getTasksForSpecialist(role: UserRole): DownstreamTaskEntity[] {
    return this.db.getTasksByRole(role);
  }
}
