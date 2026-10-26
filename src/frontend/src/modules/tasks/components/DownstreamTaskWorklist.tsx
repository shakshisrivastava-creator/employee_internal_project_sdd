import React, { useState } from 'react';
import { DownstreamTask, DownstreamTaskStatus, DownstreamTaskType, UserRole } from '../../../shared/types';

interface Props {
  currentRole: UserRole;
  tasks: DownstreamTask[];
  onUpdateStatus: (taskId: string, status: DownstreamTaskStatus, notes?: string) => Promise<void>;
}

export const DownstreamTaskWorklist: React.FC<Props> = ({
  currentRole,
  tasks,
  onUpdateStatus
}) => {
  const [selectedTask, setSelectedTask] = useState<DownstreamTask | null>(null);
  const [failNotes, setFailNotes] = useState('');
  const [modalError, setModalError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'IT' | 'PAYROLL' | 'FACILITIES'>('ALL');

  const filteredTasks = tasks.filter(t => {
    if (activeFilter === 'IT') return t.taskType === DownstreamTaskType.IT_PROVISIONING;
    if (activeFilter === 'PAYROLL') return t.taskType === DownstreamTaskType.PAYROLL_UPDATE;
    if (activeFilter === 'FACILITIES') return t.taskType === DownstreamTaskType.FACILITIES_ALLOCATION;
    return true;
  });

  const handleStart = async (task: DownstreamTask) => {
    setIsProcessing(true);
    try {
      await onUpdateStatus(task.id, DownstreamTaskStatus.IN_PROGRESS);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async (task: DownstreamTask) => {
    setIsProcessing(true);
    try {
      await onUpdateStatus(task.id, DownstreamTaskStatus.COMPLETED, undefined);
    } finally {
      setIsProcessing(false);
    }
  };

  const openFailModal = (task: DownstreamTask) => {
    setSelectedTask(task);
    setFailNotes('');
    setModalError('');
  };

  const handleConfirmFail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (!failNotes || failNotes.trim().length < 10) {
      setModalError('Failure explanation must be at least 10 characters.');
      return;
    }

    setIsProcessing(true);
    try {
      await onUpdateStatus(selectedTask.id, DownstreamTaskStatus.FAILED, failNotes.trim());
      setSelectedTask(null);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to update task.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getDaysRemaining = (deadline: string): number => {
    const target = new Date(deadline).getTime();
    const now = Date.now();
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="glass-card" data-testid="downstream-worklist">
      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Downstream Provisioning & Fulfillment Worklist
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Parallel 3-way tasks triggered upon HR approval. Track 5-day SLAs and ensure fault isolation.
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <button
            type="button"
            className={`btn ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setActiveFilter('ALL')}
          >
            All Worklist
          </button>
          <button
            type="button"
            className={`btn ${activeFilter === 'IT' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setActiveFilter('IT')}
          >
            IT Provisioning
          </button>
          <button
            type="button"
            className={`btn ${activeFilter === 'PAYROLL' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setActiveFilter('PAYROLL')}
          >
            Payroll Updates
          </button>
          <button
            type="button"
            className={`btn ${activeFilter === 'FACILITIES' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setActiveFilter('FACILITIES')}
          >
            Facilities Allocation
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      <div style={{ marginTop: '1.5rem' }}>
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>No Outstanding Tasks</div>
            <p style={{ fontSize: '0.875rem' }}>All downstream tasks are in a terminal state or pending HR approval.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredTasks.map(task => {
              const daysLeft = getDaysRemaining(task.slaDeadline);
              const isBreached = task.slaBreached || daysLeft < 0;

              return (
                <div
                  key={task.id}
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
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                        {task.taskType.replace(/_/g, ' ')}
                      </h3>
                      <span className={`badge badge-${task.status.toLowerCase()}`}>
                        {task.status}
                      </span>

                      {/* SLA Indicator */}
                      <span className={`badge ${isBreached ? 'badge-failed' : 'badge-pending'}`}>
                        {isBreached ? '⚠ SLA BREACHED' : `⏱ ${daysLeft} Days to SLA`}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Transfer Request ID: <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{task.transferRequestId}</span> • Assigned Role: <span style={{ color: '#38bdf8' }}>{task.assignedRole}</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      SLA Target Deadline: {new Date(task.slaDeadline).toLocaleString()}
                    </div>

                    {task.notes && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: '#fca5a5' }}>
                        <strong>Fulfillment Note:</strong> {task.notes}
                      </div>
                    )}
                  </div>

                  {/* Specialist Controls */}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {task.status === DownstreamTaskStatus.PENDING && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => handleStart(task)}
                        disabled={isProcessing}
                      >
                        Start Task
                      </button>
                    )}

                    {(task.status === DownstreamTaskStatus.PENDING || task.status === DownstreamTaskStatus.IN_PROGRESS) && (
                      <>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          onClick={() => openFailModal(task)}
                          disabled={isProcessing}
                        >
                          Fail Task
                        </button>
                        <button
                          type="button"
                          className="btn btn-success"
                          style={{ padding: '0.5rem 1.15rem', fontSize: '0.85rem' }}
                          onClick={() => handleComplete(task)}
                          disabled={isProcessing}
                        >
                          Complete
                        </button>
                      </>
                    )}

                    {(task.status === DownstreamTaskStatus.COMPLETED || task.status === DownstreamTaskStatus.FAILED) && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Task Finalized
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Failure Notes Modal (UT10) */}
      {selectedTask && (
        <div className="modal-overlay" data-testid="fail-task-modal">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f87171' }}>
              Flag Downstream Task as Failed
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Provide mandatory notes detailing the technical or administrative bottleneck for operational isolation.
            </p>

            {modalError && <div className="form-error" style={{ marginBottom: '1rem' }}>{modalError}</div>}

            <form onSubmit={handleConfirmFail}>
              <div className="form-group">
                <label className="form-label" htmlFor="failureNotes">
                  Failure Reason / Blocker Notes <span style={{ fontSize: '0.75rem' }}>(Min 10 chars)</span>
                </label>
                <textarea
                  id="failureNotes"
                  rows={4}
                  className="form-textarea"
                  placeholder="Describe cause of failure (e.g., license shortage, hardware backlog)..."
                  value={failNotes}
                  onChange={(e) => setFailNotes(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: failNotes.length >= 10 ? 'var(--success)' : 'var(--text-muted)' }}>
                    {failNotes.length} / 10 characters
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedTask(null)}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Submitting...' : 'Confirm Failure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
