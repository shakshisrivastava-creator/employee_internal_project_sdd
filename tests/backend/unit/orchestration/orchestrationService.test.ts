import { OrchestrationService } from '../../../../src/backend/src/modules/orchestration/services/orchestrationService';
import { TransferService } from '../../../../src/backend/src/modules/transfers/services/transferService';
import { ApprovalService } from '../../../../src/backend/src/modules/approvals/services/approvalService';
import { db } from '../../../../src/backend/src/shared/db/inMemoryDb';
import {
  ApprovalDecision,
  DownstreamTaskStatus,
  DownstreamTaskType,
  TransferStatus,
  UserRole
} from '../../../../src/backend/src/shared/types';
import { ValidationError } from '../../../../src/backend/src/shared/errors/AppError';

describe('employee-internal-transfer.TC08, TC09, TC12 — OrchestrationService Tests', () => {
  let orchestrationService: OrchestrationService;
  let transferService: TransferService;
  let approvalService: ApprovalService;

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

  const currentManager = { ...applicant, id: 'mgr-current-001', role: UserRole.CURRENT_MANAGER };
  const newManager = { ...applicant, id: 'mgr-target-002', role: UserRole.NEW_MANAGER };
  const hrAdmin = { ...applicant, id: 'hr-admin-001', role: UserRole.HR_ADMIN };

  const itSpecialist = { ...applicant, id: 'it-spec-001', role: UserRole.IT_SPECIALIST };
  const payrollSpecialist = { ...applicant, id: 'pay-spec-001', role: UserRole.PAYROLL_SPECIALIST };
  const facilitiesSpecialist = { ...applicant, id: 'fac-spec-001', role: UserRole.FACILITIES_SPECIALIST };

  const validPayload = {
    targetDepartmentId: 'dept-cloud-001',
    targetRoleId: 'role-staff-001',
    targetLocationId: 'loc-austin-001',
    targetManagerId: 'mgr-target-002',
    effectiveDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: 'Transitioning to lead cloud platform modernization.'
  };

  let transferId: string;

  beforeEach(() => {
    db.clear();
    transferService = new TransferService(db);
    approvalService = new ApprovalService(db);
    orchestrationService = new OrchestrationService(db);

    // Create and approve request through HR to reach PROCESSING_DOWNSTREAM
    const transfer = transferService.createTransfer(validPayload, applicant);
    transferId = transfer.id;
    approvalService.processDecision(transferId, currentManager, ApprovalDecision.APPROVE);
    approvalService.processDecision(transferId, newManager, ApprovalDecision.APPROVE);
    approvalService.processDecision(transferId, hrAdmin, ApprovalDecision.APPROVE);
  });

  describe('employee-internal-transfer.TC08 — Fault Isolation in Downstream Tasks (AC08, UT10)', () => {
    it('UT10: should mark IT task as FAILED while other tasks continue and transfer remains in PROCESSING_DOWNSTREAM', () => {
      const tasks = db.getTasksByTransfer(transferId);
      const itTask = tasks.find((t) => t.taskType === DownstreamTaskType.IT_PROVISIONING)!;
      const facilitiesTask = tasks.find((t) => t.taskType === DownstreamTaskType.FACILITIES_ALLOCATION)!;

      // Fail IT task with notes
      orchestrationService.updateTaskStatus(
        itTask.id,
        itSpecialist,
        DownstreamTaskStatus.FAILED,
        'Hardware backorder delayed provisioning until next sprint.'
      );

      // Complete Facilities task
      orchestrationService.updateTaskStatus(
        facilitiesTask.id,
        facilitiesSpecialist,
        DownstreamTaskStatus.COMPLETED
      );

      const updatedIT = db.getTaskById(itTask.id);
      const updatedFacilities = db.getTaskById(facilitiesTask.id);
      const transfer = db.getTransferById(transferId);

      expect(updatedIT?.status).toBe(DownstreamTaskStatus.FAILED);
      expect(updatedFacilities?.status).toBe(DownstreamTaskStatus.COMPLETED);
      expect(transfer?.status).toBe(TransferStatus.PROCESSING_DOWNSTREAM);
    });

    it('should throw ValidationError if failing a task without required notes (min 10 chars)', () => {
      const tasks = db.getTasksByTransfer(transferId);
      const itTask = tasks.find((t) => t.taskType === DownstreamTaskType.IT_PROVISIONING)!;

      expect(() =>
        orchestrationService.updateTaskStatus(itTask.id, itSpecialist, DownstreamTaskStatus.FAILED, '')
      ).toThrow(ValidationError);
    });
  });

  describe('employee-internal-transfer.TC09 — Request Lifecycle Completion (AC09, UT11)', () => {
    it('UT11: should automatically transition overall request to COMPLETED when all 3 tasks complete', () => {
      const tasks = db.getTasksByTransfer(transferId);
      const itTask = tasks.find((t) => t.taskType === DownstreamTaskType.IT_PROVISIONING)!;
      const payrollTask = tasks.find((t) => t.taskType === DownstreamTaskType.PAYROLL_UPDATE)!;
      const facilitiesTask = tasks.find((t) => t.taskType === DownstreamTaskType.FACILITIES_ALLOCATION)!;

      orchestrationService.updateTaskStatus(itTask.id, itSpecialist, DownstreamTaskStatus.COMPLETED);
      orchestrationService.updateTaskStatus(payrollTask.id, payrollSpecialist, DownstreamTaskStatus.COMPLETED);

      // Not complete yet
      expect(db.getTransferById(transferId)?.status).toBe(TransferStatus.PROCESSING_DOWNSTREAM);

      // Complete 3rd task
      orchestrationService.updateTaskStatus(facilitiesTask.id, facilitiesSpecialist, DownstreamTaskStatus.COMPLETED);

      // Now transfer is COMPLETED
      expect(db.getTransferById(transferId)?.status).toBe(TransferStatus.COMPLETED);
    });
  });

  describe('employee-internal-transfer.TC12 — SLA Tracking (AC12)', () => {
    it('should flag slaBreached = true when task deadline has passed', () => {
      const tasks = db.getTasksByTransfer(transferId);
      const itTask = tasks.find((t) => t.taskType === DownstreamTaskType.IT_PROVISIONING)!;

      // Set deadline in the past
      db.updateTask(itTask.id, {
        slaDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      });

      const breachedCount = orchestrationService.checkAndFlagSlaBreaches();
      expect(breachedCount).toBeGreaterThanOrEqual(1);

      const refreshed = db.getTaskById(itTask.id);
      expect(refreshed?.slaBreached).toBe(true);
    });
  });
});
