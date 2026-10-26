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
  PENDING_CURRENT_MGR = 'PENDING_CURRENT_MGR',
  PENDING_NEW_MGR = 'PENDING_NEW_MGR',
  PENDING_HR = 'PENDING_HR',
  PROCESSING_DOWNSTREAM = 'PROCESSING_DOWNSTREAM',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
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

export interface User {
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
  managerId: string;
}

export interface TransferRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  currentDepartmentId: string;
  currentDepartmentName: string;
  targetDepartmentId: string;
  targetDepartmentName: string;
  currentRoleId: string;
  currentRoleTitle: string;
  targetRoleId: string;
  targetRoleTitle: string;
  currentLocationId: string;
  currentLocationName: string;
  targetLocationId: string;
  targetLocationName: string;
  currentManagerId: string;
  targetManagerId: string;
  effectiveDate: string;
  reason: string;
  status: TransferStatus;
  version: number;
  submittedAt: string;
  completedAt?: string;
}

export interface DownstreamTask {
  id: string;
  transferRequestId: string;
  taskType: DownstreamTaskType;
  status: DownstreamTaskStatus;
  assignedRole: UserRole;
  notes?: string;
  slaDeadline: string;
  slaBreached: boolean;
  completedAt?: string;
}

export interface AuditLog {
  id: string;
  transferRequestId: string;
  actorId: string;
  actorRole: string;
  action: string;
  previousStatus?: string;
  newStatus: string;
  timestampUTC: string;
}
