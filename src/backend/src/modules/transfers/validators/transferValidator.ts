import { ValidationError, ValidationErrorDetail } from '../../../shared/errors/AppError';

export interface CreateTransferInput {
  targetDepartmentId?: string;
  targetRoleId?: string;
  targetLocationId?: string;
  targetManagerId?: string;
  effectiveDate?: string;
  reason?: string;
}

export function validateTransferRequest(
  payload: CreateTransferInput,
  employeeId: string,
  _currentDepartmentId?: string,
  _currentManagerId?: string
): boolean {
  const details: ValidationErrorDetail[] = [];

  // Mandatory fields check
  if (!payload.targetDepartmentId || payload.targetDepartmentId.trim() === '') {
    details.push({ field: 'targetDepartmentId', message: 'Target department is required.' });
  }
  if (!payload.targetRoleId || payload.targetRoleId.trim() === '') {
    details.push({ field: 'targetRoleId', message: 'Target role is required.' });
  }
  if (!payload.targetLocationId || payload.targetLocationId.trim() === '') {
    details.push({ field: 'targetLocationId', message: 'Target location is required.' });
  }
  if (!payload.targetManagerId || payload.targetManagerId.trim() === '') {
    details.push({ field: 'targetManagerId', message: 'Target manager is required.' });
  }
  if (!payload.effectiveDate || payload.effectiveDate.trim() === '') {
    details.push({ field: 'effectiveDate', message: 'Effective date is required.' });
  }
  if (!payload.reason || payload.reason.trim() === '') {
    details.push({ field: 'reason', message: 'Reason for transfer is required.' });
  }

  // Self-transfer check
  if (payload.targetManagerId && payload.targetManagerId === employeeId) {
    details.push({ field: 'targetManagerId', message: 'Applicant cannot be designated as target manager.' });
  }

  // Reason length check
  if (payload.reason && payload.reason.trim().length > 0) {
    if (payload.reason.trim().length < 20) {
      details.push({ field: 'reason', message: 'Reason must be at least 20 characters.' });
    } else if (payload.reason.trim().length > 1000) {
      details.push({ field: 'reason', message: 'Reason must not exceed 1000 characters.' });
    }
  }

  // Notice period check (>= 14 calendar days)
  if (payload.effectiveDate && payload.effectiveDate.trim() !== '') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const effDate = new Date(payload.effectiveDate);
    effDate.setHours(0, 0, 0, 0);

    const minNoticeDate = new Date(today);
    minNoticeDate.setDate(today.getDate() + 14);

    if (isNaN(effDate.getTime())) {
      details.push({ field: 'effectiveDate', message: 'Invalid effective date format (expected YYYY-MM-DD).' });
    } else if (effDate < minNoticeDate) {
      details.push({
        field: 'effectiveDate',
        message: 'Effective date must be at least 14 calendar days in the future.'
      });
    }
  }

  if (details.length > 0) {
    throw new ValidationError('Transfer request validation failed.', details);
  }

  return true;
}
