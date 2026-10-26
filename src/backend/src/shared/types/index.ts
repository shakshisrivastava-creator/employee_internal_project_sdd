export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  CURRENT_MANAGER = 'CURRENT_MANAGER',
  NEW_MANAGER = 'NEW_MANAGER',
  HR_ADMIN = 'HR_ADMIN',
  IT_SPECIALIST = 'IT_SPECIALIST',
  PAYROLL_SPECIALIST = 'PAYROLL_SPECIALIST',
  FACILITIES_SPECIALIST = 'FACILITIES_SPECIALIST'
}

export enum TransferStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PENDING_CURRENT_MGR = 'PENDING_CURRENT_MGR',
  PENDING_NEW_MGR = 'PENDING_NEW_MGR',
  PENDING_HR = 'PENDING_HR',
  PROCESSING_DOWNSTREAM = 'PROCESSING_DOWNSTREAM',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum ApprovalStage {
  CURRENT_MANAGER_APPROVAL = 'CURRENT_MANAGER_APPROVAL',
  NEW_MANAGER_APPROVAL = 'NEW_MANAGER_APPROVAL',
  HR_COMPLIANCE_REVIEW = 'HR_COMPLIANCE_REVIEW'
}

export enum ApprovalDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT'
}

export enum DownstreamTaskType {
  IT_PROVISIONING = 'IT_PROVISIONING',
  PAYROLL_UPDATE = 'PAYROLL_UPDATE',
  FACILITIES_ALLOCATION = 'FACILITIES_ALLOCATION'
}

export enum DownstreamTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  role: UserRole;
  currentDepartmentId: string;
  currentDepartmentName: string;
  currentRoleId: string;
  currentRoleTitle: string;
  currentLocationId: string;
  currentLocationName: string;
  managerId?: string;
}

export interface TransferRequestEntity {
  id: string;
  employeeId: string;
  status: TransferStatus;
  targetDepartmentId: string;
  targetDepartmentName?: string;
  targetRoleId: string;
  targetRoleTitle?: string;
  targetLocationId: string;
  targetLocationName?: string;
  currentManagerId: string;
  targetManagerId: string;
  effectiveDate: string; // YYYY-MM-DD
  reason: string;
  version: number;
  withdrawnAt?: string;
  withdrawnReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferDraftEntity {
  id: string;
  employeeId: string;
  formData: {
    targetDepartmentId?: string;
    targetRoleId?: string;
    targetLocationId?: string;
    targetManagerId?: string;
    effectiveDate?: string;
    reason?: string;
  };
  updatedAt: string;
}

export interface ApprovalActionEntity {
  id: string;
  transferRequestId: string;
  stage: ApprovalStage;
  decision: ApprovalDecision;
  justification?: string;
  decidedBy: string;
  decidedByName?: string;
  decidedByRole: UserRole;
  decidedAt: string;
}

export interface DownstreamTaskEntity {
  id: string;
  transferRequestId: string;
  taskType: DownstreamTaskType;
  status: DownstreamTaskStatus;
  assignedRole: UserRole;
  notes?: string;
  slaDeadline: string; // ISO UTC
  slaBreached: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntity {
  id: string;
  transferRequestId: string;
  actorId: string;
  actorRole: string;
  action: string;
  previousStatus?: string;
  newStatus: string;
  metadata?: Record<string, unknown>;
  timestampUTC: string;
}
