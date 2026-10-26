import { ApprovalService } from '../../../../src/backend/src/modules/approvals/services/approvalService';
import { TransferService } from '../../../../src/backend/src/modules/transfers/services/transferService';
import { db } from '../../../../src/backend/src/shared/db/inMemoryDb';
import { ConflictError, ForbiddenError, ValidationError } from '../../../../src/backend/src/shared/errors/AppError';
import {
  ApprovalDecision,
  ApprovalStage,
  TransferStatus,
  UserRole
} from '../../../../src/backend/src/shared/types';

describe('employee-internal-transfer.TC04, TC05, TC06, TC07, TC15 — ApprovalService Tests', () => {
  let approvalService: ApprovalService;
  let transferService: TransferService;

  const applicant = {
    id: 'emp-dev-001',
    name: 'Alice Cooper',
    email: 'alice.cooper@company.com',
    employeeCode: 'EMP1001',
    role: UserRole.EMPLOYEE,
    currentDepartmentId: 'dept-qa-001',
    currentDepartmentName: 'Quality Assurance',
    currentRoleId: 'role-qa-lead',
    currentRoleTitle: 'QA Lead',
    currentLocationId: 'loc-ny-001',
    currentLocationName: 'New York HQ',
    managerId: 'mgr-current-001'
  };

  const currentManager = {
    ...applicant,
    id: 'mgr-current-001',
    name: 'Bob CurrentMgr',
    role: UserRole.CURRENT_MANAGER
  };

  const newManager = {
    ...applicant,
    id: 'mgr-target-002',
    name: 'Carol NewMgr',
    role: UserRole.NEW_MANAGER
  };

  const hrAdmin = {
    ...applicant,
    id: 'hr-admin-001',
    name: 'David HROps',
    role: UserRole.HR_ADMIN
  };

  const validPayload = {
    targetDepartmentId: 'dept-cloud-001',
    targetRoleId: 'role-staff-001',
    targetLocationId: 'loc-austin-001',
    targetManagerId: 'mgr-target-002',
    effectiveDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: 'Transitioning to lead cloud platform modernization.'
  };

  beforeEach(() => {
    db.clear();
    transferService = new TransferService(db);
    approvalService = new ApprovalService(db);
  });

  describe('employee-internal-transfer.TC04 — Current Manager Routing & Decision (AC04, UT05, UT06)', () => {
    it('UT05: should advance status to PENDING_NEW_MGR when current manager approves', () => {
      const transfer = transferService.createTransfer(validPayload, applicant);
      expect(transfer.status).toBe(TransferStatus.PENDING_CURRENT_MGR);

      const decisionResult = approvalService.processDecision(
        transfer.id,
        currentManager,
        ApprovalDecision.APPROVE
      );

      expect(decisionResult.newStatus).toBe(TransferStatus.PENDING_NEW_MGR);
      expect(decisionResult.previousStatus).toBe(TransferStatus.PENDING_CURRENT_MGR);

      const updated = db.getTransferById(transfer.id);
      expect(updated?.status).toBe(TransferStatus.PENDING_NEW_MGR);
    });

    it('UT06: should throw ValidationError when current manager rejects without justification', () => {
      const transfer = transferService.createTransfer(validPayload, applicant);

      expect(() =>
        approvalService.processDecision(transfer.id, currentManager, ApprovalDecision.REJECT, '')
      ).toThrow(ValidationError);
    });

    it('should transition to REJECTED when current manager rejects with valid justification (min 15 chars)', () => {
      const transfer = transferService.createTransfer(validPayload, applicant);

      const decisionResult = approvalService.processDecision(
        transfer.id,
        currentManager,
        ApprovalDecision.REJECT,
        'Project commitments require retaining capacity for Q4 delivery.'
      );

      expect(decisionResult.newStatus).toBe(TransferStatus.REJECTED);
      const updated = db.getTransferById(transfer.id);
      expect(updated?.status).toBe(TransferStatus.REJECTED);
    });

    it('should throw ForbiddenError when user is not the designated current manager', () => {
      const transfer = transferService.createTransfer(validPayload, applicant);
      const impostor = { ...applicant, id: 'mgr-impostor-999', role: UserRole.CURRENT_MANAGER };

      expect(() =>
        approvalService.processDecision(transfer.id, impostor, ApprovalDecision.APPROVE)
      ).toThrow(ForbiddenError);
    });
  });

  describe('employee-internal-transfer.TC05 — New Manager Evaluation (AC05, UT07)', () => {
    it('UT07: should advance status to PENDING_HR when target receiving manager approves', () => {
      const transfer = transferService.createTransfer(validPayload, applicant);
      approvalService.processDecision(transfer.id, currentManager, ApprovalDecision.APPROVE);

      const decisionResult = approvalService.processDecision(
        transfer.id,
        newManager,
        ApprovalDecision.APPROVE
      );

      expect(decisionResult.newStatus).toBe(TransferStatus.PENDING_HR);
      const updated = db.getTransferById(transfer.id);
      expect(updated?.status).toBe(TransferStatus.PENDING_HR);
    });
  });

  describe('employee-internal-transfer.TC06 & TC07 — HR Admin Decision (AC06, AC07, UT08, UT09)', () => {
    it('UT08: should advance status to PROCESSING_DOWNSTREAM and trigger 3 tasks when HR approves', () => {
      const transfer = transferService.createTransfer(validPayload, applicant);
      approvalService.processDecision(transfer.id, currentManager, ApprovalDecision.APPROVE);
      approvalService.processDecision(transfer.id, newManager, ApprovalDecision.APPROVE);

      const decisionResult = approvalService.processDecision(
        transfer.id,
        hrAdmin,
        ApprovalDecision.APPROVE
      );

      expect(decisionResult.newStatus).toBe(TransferStatus.PROCESSING_DOWNSTREAM);

      const tasks = db.getTasksByTransfer(transfer.id);
      expect(tasks.length).toBe(3);
      expect(tasks.map((t) => t.taskType).sort()).toEqual([
        'FACILITIES_ALLOCATION',
        'IT_PROVISIONING',
        'PAYROLL_UPDATE'
      ]);
    });

    it('UT09: should transition to REJECTED and spawn zero downstream tasks when HR rejects', () => {
      const transfer = transferService.createTransfer(validPayload, applicant);
      approvalService.processDecision(transfer.id, currentManager, ApprovalDecision.APPROVE);
      approvalService.processDecision(transfer.id, newManager, ApprovalDecision.APPROVE);

      const decisionResult = approvalService.processDecision(
        transfer.id,
        hrAdmin,
        ApprovalDecision.REJECT,
        'Headcount budget has been frozen for this fiscal quarter.'
      );

      expect(decisionResult.newStatus).toBe(TransferStatus.REJECTED);
      const tasks = db.getTasksByTransfer(transfer.id);
      expect(tasks.length).toBe(0);
    });
  });

  describe('employee-internal-transfer.TC15 — Optimistic Concurrency Control (AC15, UT15)', () => {
    it('UT15: should throw ConflictError (409) when concurrent approvals submit stale version', () => {
      const transfer = transferService.createTransfer(validPayload, applicant);
      const staleVersion = transfer.version; // version 1

      // First approval increments version to 2
      approvalService.processDecision(
        transfer.id,
        currentManager,
        ApprovalDecision.APPROVE,
        undefined,
        staleVersion
      );

      // Concurrent request with version 1 must conflict
      expect(() =>
        approvalService.processDecision(
          transfer.id,
          currentManager,
          ApprovalDecision.APPROVE,
          undefined,
          staleVersion
        )
      ).toThrow(ConflictError);
    });
  });
});
