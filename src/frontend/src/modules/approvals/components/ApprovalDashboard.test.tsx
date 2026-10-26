import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ApprovalDashboard } from './ApprovalDashboard';
import { TransferRequest, TransferStatus, UserRole } from '../../../shared/types';

describe('ApprovalDashboard Component (T13 — AC04, AC05, AC06, AC07)', () => {
  const mockRequests: TransferRequest[] = [
    {
      id: 'tr-req-001',
      employeeId: 'emp-101',
      employeeName: 'Alice Employee',
      employeeCode: 'EMP1001',
      currentDepartmentId: 'dept-dev-001',
      currentDepartmentName: 'Software Engineering',
      targetDepartmentId: 'dept-cloud-001',
      targetDepartmentName: 'Cloud Infrastructure',
      currentRoleId: 'role-dev-001',
      currentRoleTitle: 'Software Engineer',
      targetRoleId: 'role-sre-001',
      targetRoleTitle: 'Site Reliability Engineer',
      currentLocationId: 'loc-ny-001',
      currentLocationName: 'New York',
      targetLocationId: 'loc-austin-001',
      targetLocationName: 'Austin Campus',
      currentManagerId: 'mgr-001',
      targetManagerId: 'mgr-002',
      effectiveDate: '2026-11-20',
      reason: 'Transitioning to cloud SRE to support infrastructure reliability.',
      status: TransferStatus.PENDING_CURRENT_MGR,
      version: 1,
      submittedAt: '2026-10-26T10:00:00Z'
    }
  ];

  it('should render approval inbox items', () => {
    render(<ApprovalDashboard role={UserRole.CURRENT_MANAGER} requests={mockRequests} onDecision={async () => {}} />);
    expect(screen.getByTestId('approval-dashboard')).toBeDefined();
    expect(screen.getByText(/Alice Employee/i)).toBeDefined();
    expect(screen.getByText(/Cloud Infrastructure/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Approve/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Reject/i })).toBeDefined();
  });

  it('should call onDecision when Approve button is clicked', async () => {
    const onDecision = vi.fn().mockResolvedValue(undefined);
    render(<ApprovalDashboard role={UserRole.CURRENT_MANAGER} requests={mockRequests} onDecision={onDecision} />);

    const approveBtn = screen.getByRole('button', { name: /Approve/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(onDecision).toHaveBeenCalledWith('tr-req-001', 'APPROVE', undefined);
    });
  });

  it('should require minimum 15 characters justification when rejecting (AC04, AC05, AC07)', async () => {
    const onDecision = vi.fn().mockResolvedValue(undefined);
    render(<ApprovalDashboard role={UserRole.CURRENT_MANAGER} requests={mockRequests} onDecision={onDecision} />);

    const rejectBtn = screen.getByRole('button', { name: /Reject/i });
    fireEvent.click(rejectBtn);

    // Modal opens
    expect(screen.getByTestId('rejection-modal')).toBeDefined();

    const textarea = screen.getByPlaceholderText(/Enter mandatory justification/i);
    fireEvent.change(textarea, { target: { value: 'Too short' } });

    const confirmRejectBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(screen.getByText(/Rejection justification must be at least 15 characters/i)).toBeDefined();
      expect(onDecision).not.toHaveBeenCalled();
    });

    // Provide valid justification
    fireEvent.change(textarea, { target: { value: 'Project handover commitments must be completed before transition.' } });
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(onDecision).toHaveBeenCalledWith('tr-req-001', 'REJECT', 'Project handover commitments must be completed before transition.');
    });
  });
});
