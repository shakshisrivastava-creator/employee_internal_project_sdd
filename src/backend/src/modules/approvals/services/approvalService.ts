import { InMemoryDatabase } from '../../../shared/db/inMemoryDb';
import {
  AuthUser,
  ApprovalDecision,
  ApprovalStage,
  TransferStatus,
  UserRole
} from '../../../shared/types';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError
} from '../../../shared/errors/AppError';

export interface DecisionResult {
  requestId: string;
  previousStatus: TransferStatus;
  newStatus: TransferStatus;
  decidedBy: string;
  role: UserRole;
  decidedAt: string;
}

export class ApprovalService {
  constructor(private db: InMemoryDatabase) {}

  public processDecision(
    transferRequestId: string,
    decidingUser: AuthUser,
    decision: ApprovalDecision,
    justification?: string,
    expectedVersion?: number
  ): DecisionResult {
    const transfer = this.db.getTransferById(transferRequestId);
    if (!transfer) {
      throw new NotFoundError(`Transfer request ${transferRequestId} not found.`);
    }

    // Optimistic Concurrency Control (AC15)
    if (expectedVersion !== undefined && transfer.version !== expectedVersion) {
      throw new ConflictError(
        'Record was updated by another process. Please refresh and try again.'
      );
    }

    // Rejection justification check (min 15 chars)
    if (decision === ApprovalDecision.REJECT) {
      if (!justification || justification.trim().length < 15) {
        throw new ValidationError(
          'Rejection justification is required and must be at least 15 characters.',
          [{ field: 'justification', message: 'Justification must be at least 15 characters.' }]
        );
      }
    }

    const previousStatus = transfer.status;
    let newStatus: TransferStatus;
    let stage: ApprovalStage;

    switch (transfer.status) {
      case TransferStatus.PENDING_CURRENT_MGR: {
        stage = ApprovalStage.CURRENT_MANAGER_APPROVAL;
        // Verify current manager authority
        const isDesignatedCurrentMgr = transfer.currentManagerId === decidingUser.id;
        const isHR = decidingUser.role === UserRole.HR_ADMIN;
        if (!isDesignatedCurrentMgr && !isHR) {
          throw new ForbiddenError('User is not authorized to act on Current Manager approval stage.');
        }

        if (decision === ApprovalDecision.APPROVE) {
          newStatus = TransferStatus.PENDING_NEW_MGR;
        } else {
          newStatus = TransferStatus.REJECTED;
        }
        break;
      }

      case TransferStatus.PENDING_NEW_MGR: {
        stage = ApprovalStage.NEW_MANAGER_APPROVAL;
        // Verify receiving manager authority
        const isDesignatedTargetMgr = transfer.targetManagerId === decidingUser.id;
        const isHR = decidingUser.role === UserRole.HR_ADMIN;
        if (!isDesignatedTargetMgr && !isHR) {
          throw new ForbiddenError('User is not authorized to act on Receiving Manager approval stage.');
        }

        if (decision === ApprovalDecision.APPROVE) {
          newStatus = TransferStatus.PENDING_HR;
        } else {
          newStatus = TransferStatus.REJECTED;
        }
        break;
      }

      case TransferStatus.PENDING_HR: {
        stage = ApprovalStage.HR_COMPLIANCE_REVIEW;
        // Verify HR admin authority
        if (decidingUser.role !== UserRole.HR_ADMIN) {
          throw new ForbiddenError('Only HR Administrators can decide on HR compliance review stage.');
        }

        if (decision === ApprovalDecision.APPROVE) {
          newStatus = TransferStatus.PROCESSING_DOWNSTREAM;
        } else {
          newStatus = TransferStatus.REJECTED;
        }
        break;
      }

      default:
        throw new ValidationError(
          `Cannot process approval decision on request in status ${transfer.status}.`,
          [{ field: 'status', message: `Invalid state for approval: ${transfer.status}` }]
        );
    }

    // Record approval action
    this.db.recordApproval({
      transferRequestId,
      stage,
      decision,
      justification,
      decidedBy: decidingUser.id,
      decidedByName: decidingUser.name,
      decidedByRole: decidingUser.role
    });

    // Update transfer status with optimistic concurrency check
    this.db.updateTransfer(
      transferRequestId,
      { status: newStatus },
      expectedVersion,
      decidingUser.id,
      decidingUser.role,
      `DECISION_${decision}_STAGE_${stage}`
    );

    // If HR approved, spawn 3 downstream tasks atomically (AC06, BR-06)
    if (stage === ApprovalStage.HR_COMPLIANCE_REVIEW && decision === ApprovalDecision.APPROVE) {
      this.db.spawnDownstreamTasks(transferRequestId, 5);
    }

    return {
      requestId: transferRequestId,
      previousStatus,
      newStatus,
      decidedBy: decidingUser.id,
      role: decidingUser.role,
      decidedAt: new Date().toISOString()
    };
  }
}
