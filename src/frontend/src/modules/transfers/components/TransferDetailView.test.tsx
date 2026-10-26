import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TransferDetailView } from './TransferDetailView';
import { TransferStatus, TransferRequest, UserRole } from '../../../shared/types';

describe('TransferDetailView Component (T12 — AC09, AC10, AC11, AC14)', () => {
  const mockTransfer: TransferRequest = {
    id: 'tr-test-101',
    employeeId: 'emp-001',
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
    effectiveDate: '2026-11-15',
    reason: 'Transitioning to cloud infrastructure to manage multi-region deployments.',
    status: TransferStatus.PENDING_CURRENT_MGR,
    version: 1,
    submittedAt: '2026-10-26T10:00:00Z'
  };

  const mockAuditLogs = [
    {
      id: 'log-1',
      transferRequestId: 'tr-test-101',
      actorId: 'emp-001',
      actorRole: 'EMPLOYEE',
      action: 'SUBMIT_TRANSFER',
      newStatus: TransferStatus.PENDING_CURRENT_MGR,
      timestampUTC: '2026-10-26T10:00:00Z'
    }
  ];

  it('should render transfer details and stepper timeline', () => {
    render(<TransferDetailView transfer={mockTransfer} auditLogs={mockAuditLogs} currentUserId="emp-001" onWithdraw={async () => {}} />);
    expect(screen.getByTestId('transfer-detail-view')).toBeDefined();
    expect(screen.getByText(/tr-test-101/)).toBeDefined();
    expect(screen.getAllByText(/Cloud Infrastructure/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Site Reliability Engineer/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId('stepper-timeline')).toBeDefined();
    expect(screen.getByTestId('audit-trail-table')).toBeDefined();
  });

  it('should allow voluntary withdrawal when in PENDING_CURRENT_MGR', async () => {
    const onWithdraw = vi.fn().mockResolvedValue(undefined);
    render(<TransferDetailView transfer={mockTransfer} auditLogs={mockAuditLogs} currentUserId="emp-001" onWithdraw={onWithdraw} />);

    const withdrawBtn = screen.getByRole('button', { name: /Withdraw Application/i });
    expect(withdrawBtn).toBeDefined();
    fireEvent.click(withdrawBtn);

    // Modal opens
    expect(screen.getByTestId('withdraw-modal')).toBeDefined();
  });

  it('should lockout voluntary withdrawal when in PENDING_HR (AC11)', () => {
    const hrTransfer = { ...mockTransfer, status: TransferStatus.PENDING_HR };
    render(<TransferDetailView transfer={hrTransfer} auditLogs={mockAuditLogs} currentUserId="emp-001" onWithdraw={async () => {}} />);

    expect(screen.queryByRole('button', { name: /Withdraw Application/i })).toBeNull();
    expect(screen.getByText(/Withdrawal Locked/i)).toBeDefined();
  });
});
