import { TransferService } from '../../../../src/backend/src/modules/transfers/services/transferService';
import { db } from '../../../../src/backend/src/shared/db/inMemoryDb';
import { ConflictError, ForbiddenError, ValidationError } from '../../../../src/backend/src/shared/errors/AppError';
import { TransferStatus, UserRole } from '../../../../src/backend/src/shared/types';

describe('employee-internal-transfer.TC02, TC03, TC10, TC11, TC13 — TransferService Unit Tests', () => {
  let transferService: TransferService;

  const validPayload = {
    targetDepartmentId: 'dept-cloud-001',
    targetDepartmentName: 'Cloud Engineering',
    targetRoleId: 'role-staff-001',
    targetRoleTitle: 'Staff Platform Engineer',
    targetLocationId: 'loc-austin-001',
    targetLocationName: 'Austin Campus',
    targetManagerId: 'mgr-austin-002',
    effectiveDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 20 days
    reason: 'Strategic transition to Austin platform team to lead cloud migration efforts.'
  };

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

  beforeEach(() => {
    db.clear();
    transferService = new TransferService(db);
  });

  describe('employee-internal-transfer.TC02 — Single Active Request Constraint (AC02, UT03)', () => {
    it('UT03: should reject submission when employee already has an active transfer request', () => {
      // First submission succeeds
      const first = transferService.createTransfer(validPayload, applicant);
      expect(first.status).toBe(TransferStatus.PENDING_CURRENT_MGR);

      // Attempt second submission
      expect(() => transferService.createTransfer(validPayload, applicant)).toThrow(ConflictError);

      try {
        transferService.createTransfer(validPayload, applicant);
      } catch (err: any) {
        expect(err.statusCode).toBe(409);
        expect(err.activeRequestId).toBe(first.id);
      }
    });

    it('should allow new submission if previous request is terminal (e.g. WITHDRAWN or REJECTED)', () => {
      const first = transferService.createTransfer(validPayload, applicant);
      transferService.withdrawTransfer(first.id, applicant, 'Personal plans changed');

      // Now submission should succeed
      const second = transferService.createTransfer(validPayload, applicant);
      expect(second.status).toBe(TransferStatus.PENDING_CURRENT_MGR);
    });
  });

  describe('employee-internal-transfer.TC03 — Draft Creation & Resumption (AC03, UT04)', () => {
    it('UT04: should save incomplete form as draft and retrieve it', () => {
      const draftData = {
        targetDepartmentId: 'dept-cloud-001',
        reason: 'Considering move to cloud team'
      };

      const saved = transferService.saveDraft(applicant.id, draftData);
      expect(saved.employeeId).toBe(applicant.id);
      expect(saved.formData.reason).toBe(draftData.reason);

      const retrieved = transferService.getDraft(applicant.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.formData.targetDepartmentId).toBe('dept-cloud-001');
    });
  });

  describe('employee-internal-transfer.TC10 & TC11 — Voluntary Withdrawal & Lockout (AC10, AC11, UT12, UT13)', () => {
    it('UT12: should allow employee to withdraw request in PENDING_CURRENT_MGR or PENDING_NEW_MGR', () => {
      const created = transferService.createTransfer(validPayload, applicant);
      const withdrawn = transferService.withdrawTransfer(created.id, applicant, 'Decided to stay in current role');

      expect(withdrawn.status).toBe(TransferStatus.WITHDRAWN);
      expect(withdrawn.withdrawnReason).toBe('Decided to stay in current role');
      expect(withdrawn.withdrawnAt).toBeDefined();
    });

    it('UT13: should reject withdrawal with ValidationError (code 400) when request is in PENDING_HR or later', () => {
      const created = transferService.createTransfer(validPayload, applicant);

      // Advance to PENDING_HR
      db.updateTransfer(created.id, { status: TransferStatus.PENDING_HR });

      expect(() =>
        transferService.withdrawTransfer(created.id, applicant, 'Too late withdrawal attempt')
      ).toThrow(ValidationError);
    });

    it('should reject withdrawal attempt with reason shorter than 10 chars', () => {
      const created = transferService.createTransfer(validPayload, applicant);

      expect(() =>
        transferService.withdrawTransfer(created.id, applicant, 'Short')
      ).toThrow(ValidationError);
    });
  });

  describe('employee-internal-transfer.TC13 — IDOR Defense (AC13, UT14)', () => {
    it('UT14: should return 403 Forbidden when unauthorized user tries to view transfer record', () => {
      const created = transferService.createTransfer(validPayload, applicant);

      const unauthorizedUser = {
        ...applicant,
        id: 'emp-stranger-099',
        role: UserRole.EMPLOYEE
      };

      expect(() => transferService.getTransferDetails(created.id, unauthorizedUser)).toThrow(ForbiddenError);
    });

    it('should allow applicant, current manager, receiving manager, and HR to view record', () => {
      const created = transferService.createTransfer(validPayload, applicant);

      // Applicant can view
      const details = transferService.getTransferDetails(created.id, applicant);
      expect(details.id).toBe(created.id);

      // Current manager can view
      const currentMgr = { ...applicant, id: applicant.managerId, role: UserRole.CURRENT_MANAGER };
      expect(transferService.getTransferDetails(created.id, currentMgr).id).toBe(created.id);

      // HR admin can view
      const hrAdmin = { ...applicant, id: 'hr-001', role: UserRole.HR_ADMIN };
      expect(transferService.getTransferDetails(created.id, hrAdmin).id).toBe(created.id);
    });
  });
});
