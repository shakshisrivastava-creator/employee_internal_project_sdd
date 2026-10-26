import {
  TransferRequestEntity,
  TransferDraftEntity,
  ApprovalActionEntity,
  DownstreamTaskEntity,
  AuditLogEntity,
  TransferStatus,
  UserRole,
  DownstreamTaskType,
  DownstreamTaskStatus,
  ApprovalStage,
  ApprovalDecision
} from '../types';
import { ConflictError, NotFoundError } from '../errors/AppError';

export class InMemoryDatabase {
  private transfers: Map<string, TransferRequestEntity> = new Map();
  private drafts: Map<string, TransferDraftEntity> = new Map();
  private approvals: Map<string, ApprovalActionEntity> = new Map();
  private tasks: Map<string, DownstreamTaskEntity> = new Map();
  private auditLogs: AuditLogEntity[] = [];

  // Reset database state for tests
  public clear(): void {
    this.transfers.clear();
    this.drafts.clear();
    this.approvals.clear();
    this.tasks.clear();
    this.auditLogs = [];
  }

  // --- Transfers ---
  public createTransfer(
    data: Omit<TransferRequestEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>
  ): TransferRequestEntity {
    // Check active request uniqueness (BR-01, AC02)
    const activeExisting = this.findActiveTransferByEmployee(data.employeeId);
    if (activeExisting) {
      throw new ConflictError(
        'Employee already has an active transfer request in progress.',
        activeExisting.id
      );
    }

    const now = new Date().toISOString();
    const id = `tr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: TransferRequestEntity = {
      ...data,
      id,
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    this.transfers.set(id, record);

    // Remove draft if exists
    this.drafts.delete(data.employeeId);

    // Audit log
    this.logAudit({
      transferRequestId: id,
      actorId: data.employeeId,
      actorRole: UserRole.EMPLOYEE,
      action: 'SUBMIT_TRANSFER_REQUEST',
      newStatus: record.status
    });

    return { ...record };
  }

  public getTransferById(id: string): TransferRequestEntity | undefined {
    const record = this.transfers.get(id);
    return record ? { ...record } : undefined;
  }

  public findActiveTransferByEmployee(employeeId: string): TransferRequestEntity | undefined {
    const nonTerminalStatuses: TransferStatus[] = [
      TransferStatus.SUBMITTED,
      TransferStatus.PENDING_CURRENT_MGR,
      TransferStatus.PENDING_NEW_MGR,
      TransferStatus.PENDING_HR,
      TransferStatus.PROCESSING_DOWNSTREAM
    ];

    for (const record of this.transfers.values()) {
      if (record.employeeId === employeeId && nonTerminalStatuses.includes(record.status)) {
        return { ...record };
      }
    }
    return undefined;
  }

  public getTransfersByEmployee(employeeId: string): TransferRequestEntity[] {
    const list: TransferRequestEntity[] = [];
    for (const record of this.transfers.values()) {
      if (record.employeeId === employeeId) {
        list.push({ ...record });
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public updateTransfer(
    id: string,
    updates: Partial<TransferRequestEntity>,
    expectedVersion?: number,
    actorId?: string,
    actorRole?: string,
    action?: string
  ): TransferRequestEntity {
    const record = this.transfers.get(id);
    if (!record) {
      throw new NotFoundError(`Transfer request ${id} not found.`);
    }

    // Optimistic Concurrency Control (AC15)
    if (expectedVersion !== undefined && record.version !== expectedVersion) {
      throw new ConflictError(
        'Record was updated by another process. Please refresh and try again.'
      );
    }

    const previousStatus = record.status;
    const updatedRecord: TransferRequestEntity = {
      ...record,
      ...updates,
      version: record.version + 1,
      updatedAt: new Date().toISOString()
    };

    this.transfers.set(id, updatedRecord);

    if (actorId && action) {
      this.logAudit({
        transferRequestId: id,
        actorId,
        actorRole: actorRole || 'SYSTEM',
        action,
        previousStatus,
        newStatus: updatedRecord.status
      });
    }

    return { ...updatedRecord };
  }

  // --- Drafts ---
  public saveDraft(employeeId: string, formData: TransferDraftEntity['formData']): TransferDraftEntity {
    const existing = this.drafts.get(employeeId);
    const now = new Date().toISOString();
    const id = existing ? existing.id : `draft-${Date.now()}`;

    const draft: TransferDraftEntity = {
      id,
      employeeId,
      formData: {
        ...(existing?.formData || {}),
        ...formData
      },
      updatedAt: now
    };

    this.drafts.set(employeeId, draft);
    return { ...draft };
  }

  public getDraft(employeeId: string): TransferDraftEntity | undefined {
    const draft = this.drafts.get(employeeId);
    return draft ? { ...draft } : undefined;
  }

  public deleteDraft(employeeId: string): void {
    this.drafts.delete(employeeId);
  }

  // --- Approvals ---
  public recordApproval(action: Omit<ApprovalActionEntity, 'id' | 'decidedAt'>): ApprovalActionEntity {
    const id = `appr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: ApprovalActionEntity = {
      ...action,
      id,
      decidedAt: new Date().toISOString()
    };
    this.approvals.set(id, record);
    return { ...record };
  }

  public getApprovalsByTransfer(transferRequestId: string): ApprovalActionEntity[] {
    const list: ApprovalActionEntity[] = [];
    for (const item of this.approvals.values()) {
      if (item.transferRequestId === transferRequestId) {
        list.push({ ...item });
      }
    }
    return list.sort((a, b) => new Date(a.decidedAt).getTime() - new Date(b.decidedAt).getTime());
  }

  // --- Downstream Tasks ---
  public spawnDownstreamTasks(transferRequestId: string, slaBusinessDays: number = 5): DownstreamTaskEntity[] {
    const now = new Date();
    // SLA deadline: 5 days
    const deadline = new Date(now.getTime() + slaBusinessDays * 24 * 60 * 60 * 1000).toISOString();

    const taskConfigs = [
      { type: DownstreamTaskType.IT_PROVISIONING, role: UserRole.IT_SPECIALIST },
      { type: DownstreamTaskType.PAYROLL_UPDATE, role: UserRole.PAYROLL_SPECIALIST },
      { type: DownstreamTaskType.FACILITIES_ALLOCATION, role: UserRole.FACILITIES_SPECIALIST }
    ];

    const created: DownstreamTaskEntity[] = [];
    for (const cfg of taskConfigs) {
      const id = `task-${cfg.type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const task: DownstreamTaskEntity = {
        id,
        transferRequestId,
        taskType: cfg.type,
        status: DownstreamTaskStatus.PENDING,
        assignedRole: cfg.role,
        slaDeadline: deadline,
        slaBreached: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      this.tasks.set(id, task);
      created.push({ ...task });
    }

    return created;
  }

  public getTasksByTransfer(transferRequestId: string): DownstreamTaskEntity[] {
    const list: DownstreamTaskEntity[] = [];
    for (const t of this.tasks.values()) {
      if (t.transferRequestId === transferRequestId) {
        list.push({ ...t });
      }
    }
    return list;
  }

  public getTaskById(taskId: string): DownstreamTaskEntity | undefined {
    const task = this.tasks.get(taskId);
    return task ? { ...task } : undefined;
  }

  public getTasksByRole(role: UserRole): DownstreamTaskEntity[] {
    const list: DownstreamTaskEntity[] = [];
    for (const t of this.tasks.values()) {
      if (t.assignedRole === role) {
        list.push({ ...t });
      }
    }
    return list;
  }

  public updateTask(
    taskId: string,
    updates: Partial<DownstreamTaskEntity>
  ): DownstreamTaskEntity {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new NotFoundError(`Task ${taskId} not found.`);
    }

    const updated: DownstreamTaskEntity = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.status === DownstreamTaskStatus.COMPLETED || updates.status === DownstreamTaskStatus.FAILED) {
      updated.completedAt = new Date().toISOString();
    }

    this.tasks.set(taskId, updated);
    return { ...updated };
  }

  // --- Audit Log ---
  public logAudit(entry: Omit<AuditLogEntity, 'id' | 'timestampUTC'>): AuditLogEntity {
    const record: AuditLogEntity = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestampUTC: new Date().toISOString()
    };
    this.auditLogs.push(record);
    return { ...record };
  }

  public getAuditLogsByTransfer(transferRequestId: string): AuditLogEntity[] {
    return this.auditLogs.filter((l) => l.transferRequestId === transferRequestId);
  }
}

export const db = new InMemoryDatabase();
