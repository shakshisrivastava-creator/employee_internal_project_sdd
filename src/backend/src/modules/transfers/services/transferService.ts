import { InMemoryDatabase } from '../../../shared/db/inMemoryDb';
import {
  AuthUser,
  TransferRequestEntity,
  TransferDraftEntity,
  TransferStatus,
  UserRole,
  ApprovalStage
} from '../../../shared/types';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError
} from '../../../shared/errors/AppError';
import { validateTransferRequest, CreateTransferInput } from '../validators/transferValidator';

export interface TransferDetailsResponse extends TransferRequestEntity {
  timeline: Array<{
    stage: string;
    status: string;
    actor?: string;
    comments?: string;
    timestamp?: string;
  }>;
  canWithdraw: boolean;
}

export class TransferService {
  constructor(private db: InMemoryDatabase) {}

  public createTransfer(
    payload: CreateTransferInput & {
      targetDepartmentName?: string;
      targetRoleTitle?: string;
      targetLocationName?: string;
    },
    applicant: AuthUser
  ): TransferRequestEntity {
    // Validate business rules
    validateTransferRequest(payload, applicant.id, applicant.currentDepartmentId, applicant.managerId);

    const record = this.db.createTransfer({
      employeeId: applicant.id,
      status: TransferStatus.PENDING_CURRENT_MGR,
      targetDepartmentId: payload.targetDepartmentId!,
      targetDepartmentName: payload.targetDepartmentName,
      targetRoleId: payload.targetRoleId!,
      targetRoleTitle: payload.targetRoleTitle,
      targetLocationId: payload.targetLocationId!,
      targetLocationName: payload.targetLocationName,
      currentManagerId: applicant.managerId || 'mgr-unassigned',
      targetManagerId: payload.targetManagerId!,
      effectiveDate: payload.effectiveDate!,
      reason: payload.reason!
    });

    return record;
  }

  public saveDraft(employeeId: string, formData: TransferDraftEntity['formData']): TransferDraftEntity {
    return this.db.saveDraft(employeeId, formData);
  }

  public getDraft(employeeId: string): TransferDraftEntity | undefined {
    return this.db.getDraft(employeeId);
  }

  public withdrawTransfer(id: string, user: AuthUser, reason: string): TransferRequestEntity {
    const transfer = this.db.getTransferById(id);
    if (!transfer) {
      throw new NotFoundError(`Transfer request ${id} not found.`);
    }

    // IDOR check: Only applicant can withdraw
    if (transfer.employeeId !== user.id) {
      throw new ForbiddenError('Only the applicant can withdraw this request.');
    }

    // Reason validation: min 10 chars
    if (!reason || reason.trim().length < 10) {
      throw new ValidationError('Withdrawal reason must be at least 10 characters.', [
        { field: 'reason', message: 'Withdrawal reason must be at least 10 characters.' }
      ]);
    }

    // Lockout post-HR (BR-09, AC11): allowed only in SUBMITTED, PENDING_CURRENT_MGR, PENDING_NEW_MGR
    const allowableStatuses = [
      TransferStatus.SUBMITTED,
      TransferStatus.PENDING_CURRENT_MGR,
      TransferStatus.PENDING_NEW_MGR
    ];

    if (!allowableStatuses.includes(transfer.status)) {
      throw new ValidationError('Transfer request cannot be withdrawn after HR review stage.', [
        { field: 'status', message: 'Transfer request cannot be withdrawn after HR review stage.' }
      ]);
    }

    return this.db.updateTransfer(
      id,
      {
        status: TransferStatus.WITHDRAWN,
        withdrawnAt: new Date().toISOString(),
        withdrawnReason: reason
      },
      undefined,
      user.id,
      user.role,
      'WITHDRAW_TRANSFER_REQUEST'
    );
  }

  public getTransferDetails(id: string, user: AuthUser): TransferDetailsResponse {
    const transfer = this.db.getTransferById(id);
    if (!transfer) {
      throw new NotFoundError(`Transfer request ${id} not found.`);
    }

    // IDOR Defense (NFR-04, AC13)
    const isApplicant = transfer.employeeId === user.id;
    const isCurrentMgr = transfer.currentManagerId === user.id;
    const isTargetMgr = transfer.targetManagerId === user.id;
    const isPrivilegedRole = [
      UserRole.HR_ADMIN,
      UserRole.IT_SPECIALIST,
      UserRole.PAYROLL_SPECIALIST,
      UserRole.FACILITIES_SPECIALIST
    ].includes(user.role);

    if (!isApplicant && !isCurrentMgr && !isTargetMgr && !isPrivilegedRole) {
      throw new ForbiddenError('Access denied to requested transfer record.');
    }

    const approvals = this.db.getApprovalsByTransfer(id);
    const tasks = this.db.getTasksByTransfer(id);

    const timeline = [
      {
        stage: 'SUBMISSION',
        status: 'COMPLETED',
        timestamp: transfer.createdAt
      },
      {
        stage: 'CURRENT_MANAGER_APPROVAL',
        status: approvals.some((a) => a.stage === ApprovalStage.CURRENT_MANAGER_APPROVAL)
          ? 'COMPLETED'
          : transfer.status === TransferStatus.PENDING_CURRENT_MGR
          ? 'IN_PROGRESS'
          : 'NOT_STARTED'
      },
      {
        stage: 'NEW_MANAGER_APPROVAL',
        status: approvals.some((a) => a.stage === ApprovalStage.NEW_MANAGER_APPROVAL)
          ? 'COMPLETED'
          : transfer.status === TransferStatus.PENDING_NEW_MGR
          ? 'IN_PROGRESS'
          : 'NOT_STARTED'
      },
      {
        stage: 'HR_COMPLIANCE_REVIEW',
        status: approvals.some((a) => a.stage === ApprovalStage.HR_COMPLIANCE_REVIEW)
          ? 'COMPLETED'
          : transfer.status === TransferStatus.PENDING_HR
          ? 'IN_PROGRESS'
          : 'NOT_STARTED'
      },
      {
        stage: 'DOWNSTREAM_ORCHESTRATION',
        status:
          tasks.length > 0 && tasks.every((t) => t.status === 'COMPLETED')
            ? 'COMPLETED'
            : tasks.length > 0
            ? 'IN_PROGRESS'
            : 'NOT_STARTED'
      }
    ];

    const canWithdraw =
      isApplicant &&
      [
        TransferStatus.SUBMITTED,
        TransferStatus.PENDING_CURRENT_MGR,
        TransferStatus.PENDING_NEW_MGR
      ].includes(transfer.status);

    return {
      ...transfer,
      timeline,
      canWithdraw
    };
  }

  public getMyTransfers(employeeId: string) {
    const list = this.db.getTransfersByEmployee(employeeId);
    const nonTerminalStatuses = [
      TransferStatus.SUBMITTED,
      TransferStatus.PENDING_CURRENT_MGR,
      TransferStatus.PENDING_NEW_MGR,
      TransferStatus.PENDING_HR,
      TransferStatus.PROCESSING_DOWNSTREAM
    ];

    const activeRequest = list.find((t) => nonTerminalStatuses.includes(t.status));
    const history = list.filter((t) => !nonTerminalStatuses.includes(t.status));

    return { activeRequest, history };
  }
}
