import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../shared/middleware/authMiddleware';
import { OrchestrationService } from '../services/orchestrationService';
import { db } from '../../../shared/db/inMemoryDb';
import { UnauthorizedError } from '../../../shared/errors/AppError';

export class OrchestrationController {
  private orchestrationService: OrchestrationService;

  constructor() {
    this.orchestrationService = new OrchestrationService(db);
  }

  // GET /api/v1/orchestration/tasks (API07)
  public getTasks = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const tasks = this.orchestrationService.getTasksForSpecialist(req.user.role);
      res.status(200).json({ tasks });
    } catch (err) {
      next(err);
    }
  };

  // PATCH /api/v1/orchestration/tasks/:id (API08)
  public updateTask = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const { status, notes } = req.body;
      const updatedTask = this.orchestrationService.updateTaskStatus(
        req.params.id,
        req.user,
        status,
        notes
      );

      const parentTransfer = db.getTransferById(updatedTask.transferRequestId);

      res.status(200).json({
        taskId: updatedTask.id,
        status: updatedTask.status,
        completedAt: updatedTask.completedAt,
        overallTransferStatus: parentTransfer?.status
      });
    } catch (err) {
      next(err);
    }
  };
}
