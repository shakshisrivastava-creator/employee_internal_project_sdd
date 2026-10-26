import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { DownstreamTaskWorklist } from './DownstreamTaskWorklist';
import { DownstreamTask, DownstreamTaskType, DownstreamTaskStatus, UserRole } from '../../../shared/types';

describe('DownstreamTaskWorklist Component (T14 — AC08, AC09, AC12)', () => {
  const mockTasks: DownstreamTask[] = [
    {
      id: 'task-it-001',
      transferRequestId: 'tr-001',
      taskType: DownstreamTaskType.IT_PROVISIONING,
      status: DownstreamTaskStatus.PENDING,
      assignedRole: UserRole.IT_SPECIALIST,
      slaDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      slaBreached: false
    },
    {
      id: 'task-pay-002',
      transferRequestId: 'tr-001',
      taskType: DownstreamTaskType.PAYROLL_UPDATE,
      status: DownstreamTaskStatus.IN_PROGRESS,
      assignedRole: UserRole.PAYROLL_SPECIALIST,
      slaDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      slaBreached: true
    }
  ];

  it('should render task items and SLA badges', () => {
    render(<DownstreamTaskWorklist currentRole={UserRole.IT_SPECIALIST} tasks={mockTasks} onUpdateStatus={async () => {}} />);
    expect(screen.getByTestId('downstream-worklist')).toBeDefined();
    expect(screen.getAllByText(/IT PROVISIONING/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/PAYROLL UPDATE/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/SLA BREACHED/i)).toBeDefined();
  });

  it('should call onUpdateStatus when Mark Completed is clicked', async () => {
    const onUpdateStatus = vi.fn().mockResolvedValue(undefined);
    render(<DownstreamTaskWorklist currentRole={UserRole.IT_SPECIALIST} tasks={mockTasks} onUpdateStatus={onUpdateStatus} />);

    const completeBtn = screen.getAllByRole('button', { name: /Complete/i })[0];
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(onUpdateStatus).toHaveBeenCalledWith('task-it-001', DownstreamTaskStatus.COMPLETED, undefined);
    });
  });

  it('should require minimum 10 characters notes when marking task as FAILED (AC08, UT10)', async () => {
    const onUpdateStatus = vi.fn().mockResolvedValue(undefined);
    render(<DownstreamTaskWorklist currentRole={UserRole.IT_SPECIALIST} tasks={mockTasks} onUpdateStatus={onUpdateStatus} />);

    const failBtn = screen.getAllByRole('button', { name: /Fail Task/i })[0];
    fireEvent.click(failBtn);

    // Failure modal opens
    expect(screen.getByTestId('fail-task-modal')).toBeDefined();

    const textarea = screen.getByPlaceholderText(/Describe cause of failure/i);
    fireEvent.change(textarea, { target: { value: 'short' } });

    const confirmFailBtn = screen.getByRole('button', { name: /Confirm Failure/i });
    fireEvent.click(confirmFailBtn);

    await waitFor(() => {
      expect(screen.getByText(/Failure explanation must be at least 10 characters/i)).toBeDefined();
      expect(onUpdateStatus).not.toHaveBeenCalled();
    });

    fireEvent.change(textarea, { target: { value: 'Hardware provisioning laptop stock depleted in regional center.' } });
    fireEvent.click(confirmFailBtn);

    await waitFor(() => {
      expect(onUpdateStatus).toHaveBeenCalledWith('task-it-001', DownstreamTaskStatus.FAILED, 'Hardware provisioning laptop stock depleted in regional center.');
    });
  });
});
