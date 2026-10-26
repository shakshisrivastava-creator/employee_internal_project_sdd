import React, { useState } from 'react';
import { TransferRequest, TransferStatus, AuditLog, DownstreamTask } from '../../../shared/types';

interface Props {
  transfer: TransferRequest;
  auditLogs?: AuditLog[];
  downstreamTasks?: DownstreamTask[];
  currentUserId?: string;
  onWithdraw: (reason: string) => Promise<void>;
}

export const TransferDetailView: React.FC<Props> = ({
  transfer,
  auditLogs = [],
  downstreamTasks = [],
  currentUserId,
  onWithdraw
}) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Stepper calculations
  const steps = [
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'LINE_MGR', label: 'Current Manager' },
    { key: 'NEW_MGR', label: 'New Manager' },
    { key: 'HR_ADMIN', label: 'HR Admin' },
    { key: 'DOWNSTREAM', label: 'Provisioning' },
    { key: 'COMPLETED', label: 'Completed' }
  ];

  const getStepStatus = (index: number): 'completed' | 'active' | 'pending' | 'failed' => {
    if (transfer.status === TransferStatus.REJECTED) {
      return index === 1 ? 'failed' : 'pending';
    }
    if (transfer.status === TransferStatus.WITHDRAWN) {
      return 'pending';
    }

    const statusMap: Record<TransferStatus, number> = {
      [TransferStatus.DRAFT]: 0,
      [TransferStatus.PENDING_CURRENT_MGR]: 1,
      [TransferStatus.PENDING_NEW_MGR]: 2,
      [TransferStatus.PENDING_HR]: 3,
      [TransferStatus.PROCESSING_DOWNSTREAM]: 4,
      [TransferStatus.COMPLETED]: 5,
      [TransferStatus.REJECTED]: 1,
      [TransferStatus.WITHDRAWN]: 1
    };

    const currentActiveIndex = statusMap[transfer.status] ?? 1;

    if (index < currentActiveIndex || transfer.status === TransferStatus.COMPLETED) {
      return 'completed';
    }
    if (index === currentActiveIndex) {
      return 'active';
    }
    return 'pending';
  };

  // AC10 & AC11: Withdrawal allowed ONLY in PENDING_CURRENT_MGR or PENDING_NEW_MGR
  const isWithdrawalAllowed =
    transfer.status === TransferStatus.PENDING_CURRENT_MGR ||
    transfer.status === TransferStatus.PENDING_NEW_MGR;

  const isApplicant = currentUserId ? transfer.employeeId === currentUserId : true;

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawReason || withdrawReason.trim().length < 10) {
      setWithdrawError('Withdrawal justification must be at least 10 characters.');
      return;
    }

    setIsWithdrawing(true);
    try {
      await onWithdraw(withdrawReason.trim());
      setShowWithdrawModal(false);
    } catch (err: any) {
      setWithdrawError(err?.message || 'Failed to withdraw transfer request.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="glass-card" data-testid="transfer-detail-view">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Transfer Journey Overview</h2>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>#{transfer.id}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Submitted on {new Date(transfer.submittedAt).toLocaleDateString()} • Version {transfer.version}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className={`badge badge-${transfer.status.toLowerCase().replace(/_/g, '-')}`}>
            {transfer.status.replace(/_/g, ' ')}
          </span>

          {isApplicant && isWithdrawalAllowed && (
            <button
              type="button"
              className="btn btn-danger"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              onClick={() => setShowWithdrawModal(true)}
            >
              Withdraw Application
            </button>
          )}

          {isApplicant && !isWithdrawalAllowed && transfer.status !== TransferStatus.COMPLETED && transfer.status !== TransferStatus.REJECTED && transfer.status !== TransferStatus.WITHDRAWN && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              🔒 Withdrawal Locked (HR Evaluation active)
            </span>
          )}
        </div>
      </div>

      {/* Visual Stepper Timeline */}
      <div style={{ margin: '2rem 0' }} data-testid="stepper-timeline">
        <div className="stepper-container">
          <div className="stepper-line" />
          {steps.map((step, idx) => {
            const status = getStepStatus(idx);
            return (
              <div key={step.key} className="stepper-step">
                <div className={`stepper-circle ${status}`}>
                  {status === 'completed' ? '✓' : idx + 1}
                </div>
                <div className={`stepper-title ${status === 'active' ? 'active' : ''}`}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Transition Info & Fulfillment */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Transition Comparison Card */}
        <div style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary-light)', letterSpacing: '0.02em' }}>
            Lateral Mobility Transition Path
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Position</span>
              <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{transfer.currentRoleTitle}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{transfer.currentDepartmentName}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {transfer.currentLocationName}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Position</span>
              <div style={{ fontWeight: 600, color: '#38bdf8', marginTop: '0.2rem' }}>{transfer.targetRoleTitle}</div>
              <div style={{ fontSize: '0.85rem', color: '#7dd3fc' }}>{transfer.targetDepartmentName}</div>
              <div style={{ fontSize: '0.85rem', color: '#7dd3fc' }}>📍 {transfer.targetLocationName}</div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Effective Notice Date</span>
            <div style={{ fontWeight: 600 }}>{transfer.effectiveDate}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.5rem', display: 'block' }}>Applicant Justification</span>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>{transfer.reason}</p>
          </div>
        </div>

        {/* Downstream Tasks Checklist (AC08, AC09, AC12) */}
        <div style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#38bdf8' }}>
            Downstream Fulfillment Tasks (3-Way Parallel)
          </h3>
          {downstreamTasks.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Tasks will be atomically spawned upon final HR Administrative approval.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {downstreamTasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.taskType.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      SLA Deadline: {new Date(task.slaDeadline).toLocaleDateString()} {task.slaBreached && '⚠ BREACHED'}
                    </div>
                  </div>
                  <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Immutable Audit Trail History (AC14) */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Immutable Audit Log</h3>
        <div style={{ overflowX: 'auto' }}>
          <table data-testid="audit-trail-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.65rem' }}>Timestamp</th>
                <th style={{ padding: '0.65rem' }}>Actor Role</th>
                <th style={{ padding: '0.65rem' }}>Action</th>
                <th style={{ padding: '0.65rem' }}>Transition Status</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <td style={{ padding: '0.65rem' }}>{new Date(log.timestampUTC).toLocaleString()}</td>
                  <td style={{ padding: '0.65rem', fontWeight: 600 }}>{log.actorRole}</td>
                  <td style={{ padding: '0.65rem' }}>{log.action}</td>
                  <td style={{ padding: '0.65rem' }}>
                    <span className={`badge badge-${log.newStatus.toLowerCase().replace(/_/g, '-')}`}>
                      {log.newStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Voluntary Withdrawal Modal (AC10) */}
      {showWithdrawModal && (
        <div className="modal-overlay" data-testid="withdraw-modal">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f87171' }}>
              Confirm Voluntary Withdrawal
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Are you sure you want to withdraw this application? This action is terminal and will notify both line managers.
            </p>

            {withdrawError && <div className="form-error" style={{ marginBottom: '1rem' }}>{withdrawError}</div>}

            <form onSubmit={handleWithdrawSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="withdrawReason">
                  Mandatory Reason for Withdrawal <span style={{ fontSize: '0.75rem' }}>(Min 10 chars)</span>
                </label>
                <textarea
                  id="withdrawReason"
                  rows={3}
                  className="form-textarea"
                  placeholder="Explain why you wish to cancel this transfer request..."
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={isWithdrawing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
