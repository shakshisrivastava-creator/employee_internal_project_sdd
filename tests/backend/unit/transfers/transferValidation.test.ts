import { validateTransferRequest } from '../../../../src/backend/src/modules/transfers/validators/transferValidator';
import { ValidationError } from '../../../../src/backend/src/shared/errors/AppError';

describe('employee-internal-transfer.TC01 — Transfer Request Validation (AC01)', () => {
  const baseValidPayload = {
    targetDepartmentId: 'dept-eng-001',
    targetRoleId: 'role-sr-dev-001',
    targetLocationId: 'loc-ny-001',
    targetManagerId: 'mgr-002',
    effectiveDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days in future
    reason: 'Seeking career growth and alignment with new cloud platform engineering initiatives.' // > 20 chars
  };

  it('UT01: should throw ValidationError when effectiveDate is less than 14 calendar days in future', () => {
    const invalidDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days
    const payload = { ...baseValidPayload, effectiveDate: invalidDate };

    expect(() => validateTransferRequest(payload, 'emp-001', 'dept-eng-001', 'mgr-001')).toThrow(ValidationError);
    try {
      validateTransferRequest(payload, 'emp-001', 'dept-eng-001', 'mgr-001');
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
      expect(err.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'effectiveDate' })
        ])
      );
    }
  });

  it('UT02: should throw ValidationError when targetManagerId equals applicant employeeId', () => {
    const payload = { ...baseValidPayload, targetManagerId: 'emp-001' };

    expect(() => validateTransferRequest(payload, 'emp-001', 'dept-eng-001', 'mgr-001')).toThrow(ValidationError);
    try {
      validateTransferRequest(payload, 'emp-001', 'dept-eng-001', 'mgr-001');
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
      expect(err.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'targetManagerId' })
        ])
      );
    }
  });

  it('should throw ValidationError when mandatory fields are missing', () => {
    const payload = {
      targetDepartmentId: '',
      targetRoleId: '',
      targetLocationId: '',
      targetManagerId: '',
      effectiveDate: '',
      reason: ''
    };

    expect(() => validateTransferRequest(payload, 'emp-001', 'dept-eng-001', 'mgr-001')).toThrow(ValidationError);
    try {
      validateTransferRequest(payload, 'emp-001', 'dept-eng-001', 'mgr-001');
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
      expect(err.details.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('should throw ValidationError when reason is shorter than 20 characters', () => {
    const payload = { ...baseValidPayload, reason: 'Too short' };

    expect(() => validateTransferRequest(payload, 'emp-001', 'dept-eng-001', 'mgr-001')).toThrow(ValidationError);
  });

  it('should pass validation when all inputs satisfy business rules', () => {
    const result = validateTransferRequest(baseValidPayload, 'emp-001', 'dept-finance-001', 'mgr-001');
    expect(result).toBe(true);
  });
});
