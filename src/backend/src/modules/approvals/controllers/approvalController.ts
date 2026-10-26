import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../shared/middleware/authMiddleware';
import { ApprovalService } from '../services/approvalService';
import { db } from '../../../shared/db/inMemoryDb';
import { UnauthorizedError } from '../../../shared/errors/AppError';
import { UserRole, TransferStatus } from '../../../shared/types';

export class ApprovalController {
  private approvalService: ApprovalService;

  constructor() {
    this.approvalService = new ApprovalService(db);
  }

  // POST /api/v1/approvals/:id/decision (API06)
  public processDecision = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const { decision, justification, version } = req.body;
      const result = this.approvalService.processDecision(
        req.params.id,
        req.user,
        decision,
        justification,
        version
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  // GET /api/v1/approvals/inbox
  public getInbox = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      // Query transfers where status corresponds to user's assigned role
      const user = req.user;
      const allTransfers: any[] = [];
      const isHR = user.role === UserRole.HR_ADMIN;

      // Access in-memory DB transfers directly for inbox filtering
      // Look for transfers waiting for this user
      if (user.role === UserRole.CURRENT_MANAGER || isHR) {
        // Find transfers where status == PENDING_CURRENT_MGR and currentManagerId == user.id (or HR)
      }

      res.status(200).json({ pendingApprovals: allTransfers });
    } catch (err) {
      next(err);
    }
  };
}
