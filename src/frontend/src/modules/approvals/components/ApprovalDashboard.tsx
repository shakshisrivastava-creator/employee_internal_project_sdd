import React, { useState } from 'react';
import { TransferRequest, UserRole, TransferStatus } from '../../../shared/types';

interface Props {
  role: UserRole;
  requests: TransferRequest[];
  onDecision: (requestId: string, decision: 'APPROVE' | 'REJECT', justification?: string) => Promise<void>;
}

export const ApprovalDashboard: React.FC<Props> = ({
  role,
  requests,
  onDecision
}) => {
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [justification, setJustification] = useState('');
  const [modalError, setModalError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'TARGET' | 'HR'>(
    role === UserRole.HR_ADMIN ? 'HR' : role === UserRole.NEW_MANAGER ? 'TARGET' : 'CURRENT'
  );

  // Filter requests according to tab / role
  const filteredRequests = requests.filter(req => {
    if (activeTab === 'CURRENT') return req.status === TransferStatus.PENDING_CURRENT_MGR;
    if (activeTab === 'TARGET') return req.status === TransferStatus.PENDING_NEW_MGR;
    if (activeTab === 'HR') return req.status === TransferStatus.PENDING_HR;
    return true;
  });

  const handleApprove = async (req: TransferRequest) => {
    setIsProcessing(true);
    try {
      await onDecision(req.id, 'APPROVE', undefined);
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (req: TransferRequest) => {
    setSelectedRequest(req);
    setJustification('');
    setModalError('');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (!justification || justification.trim().length < 15) {
      setModalError('Rejection justification must be at least 15 characters.');
      return;
    }

    setIsProcessing(true);
    try {
      await onDecision(selectedRequest.id, 'REJECT', justification.trim());
      setSelectedRequest(null);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to submit rejection decision.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-card" data-testid="approval-dashboard">
      {/* Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Multi-Gate Approval Inboxes
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Review, validate and authorize employee lateral mobility transitions across organizational gates.
          </p>
        </div>

        {/* Gate Filter Tabs */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'CURRENT' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setActiveTab('CURRENT')}
          >
            Current Line Manager
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'TARGET' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setActiveTab('TARGET')}
          >
            Receiving Manager
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'HR' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setActiveTab('HR')}
          >
            HR Administration
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div style={{ marginTop: '1.5rem' }}>
        {filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Inbox Zero</div>
            <p style={{ fontSize: '0.875rem' }}>No pending transfer requests require approval for this gate.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredRequests.map(req => (
              <div
                key={req.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{req.employeeName}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({req.employeeCode})</span>
                    <span className="badge badge-pending">{req.status.replace(/_/g, ' ')}</span>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <span>{req.currentDepartmentName} ({req.currentRoleTitle})</span>
                    <span style={{ margin: '0 0.5rem', color: '#38bdf8' }}>➔</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>{req.targetDepartmentName} ({req.targetRoleTitle})</span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                    "{req.reason}"
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Effective Date: {req.effectiveDate} • Submitted: {new Date(req.submittedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '0.5rem 1.15rem' }}
                    onClick={() => openRejectModal(req)}
                    disabled={isProcessing}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    style={{ padding: '0.5rem 1.25rem' }}
                    onClick={() => handleApprove(req)}
                    disabled={isProcessing}
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Justification Modal (AC04, AC05, AC07) */}
      {selectedRequest && (
        <div className="modal-overlay" data-testid="rejection-modal">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f87171' }}>
              Reject Transfer Request
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Mandatory INT SDD policy requires documented justification (minimum 15 characters) for audit trail compliance.
            </p>

            {modalError && <div className="form-error" style={{ marginBottom: '1rem' }}>{modalError}</div>}

            <form onSubmit={handleConfirmReject}>
              <div className="form-group">
                <label className="form-label" htmlFor="rejectionJustification">
                  Rejection Justification <span style={{ fontSize: '0.75rem' }}>(Min 15 chars)</span>
                </label>
                <textarea
                  id="rejectionJustification"
                  rows={4}
                  className="form-textarea"
                  placeholder="Enter mandatory justification for audit records..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: justification.length >= 15 ? 'var(--success)' : 'var(--text-muted)' }}>
                    {justification.length} / 15 characters
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedRequest(null)}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Submitting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
