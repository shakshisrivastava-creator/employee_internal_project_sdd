import React, { useState, useEffect } from 'react';
import { User, UserRole, TransferRequest, TransferStatus, DownstreamTask, DownstreamTaskType, DownstreamTaskStatus, AuditLog } from './shared/types';
import { TransferInitiationForm, TransferFormData } from './modules/transfers/components/TransferInitiationForm';
import { TransferDetailView } from './modules/transfers/components/TransferDetailView';
import { ApprovalDashboard } from './modules/approvals/components/ApprovalDashboard';
import { DownstreamTaskWorklist } from './modules/tasks/components/DownstreamTaskWorklist';

const USERS: User[] = [
  {
    id: 'emp-integration-001',
    name: 'Alice Employee',
    email: 'alice@company.com',
    employeeCode: 'EMP2001',
    role: UserRole.EMPLOYEE,
    currentDepartmentId: 'dept-dev-001',
    currentDepartmentName: 'Software Engineering',
    currentRoleId: 'role-dev-001',
    currentRoleTitle: 'Software Engineer',
    currentLocationId: 'loc-ny-001',
    currentLocationName: 'New York Flagship Office',
    managerId: 'mgr-line-001'
  },
  {
    id: 'mgr-line-001',
    name: 'Bob CurrentManager',
    email: 'bob@company.com',
    employeeCode: 'MGR1001',
    role: UserRole.CURRENT_MANAGER,
    currentDepartmentId: 'dept-dev-001',
    currentDepartmentName: 'Software Engineering',
    currentRoleId: 'role-mgr-001',
    currentRoleTitle: 'Engineering Director',
    currentLocationId: 'loc-ny-001',
    currentLocationName: 'New York Flagship Office',
    managerId: 'exec-001'
  },
  {
    id: 'mgr-target-001',
    name: 'Carol TargetManager',
    email: 'carol@company.com',
    employeeCode: 'MGR1002',
    role: UserRole.NEW_MANAGER,
    currentDepartmentId: 'dept-cloud-001',
    currentDepartmentName: 'Cloud Infrastructure',
    currentRoleId: 'role-lead-001',
    currentRoleTitle: 'Cloud Infrastructure Lead',
    currentLocationId: 'loc-austin-001',
    currentLocationName: 'Austin Campus',
    managerId: 'exec-001'
  },
  {
    id: 'hr-admin-001',
    name: 'David HRAdmin',
    email: 'david@company.com',
    employeeCode: 'HR1001',
    role: UserRole.HR_ADMIN,
    currentDepartmentId: 'dept-hr-001',
    currentDepartmentName: 'People & Operations',
    currentRoleId: 'role-hr-001',
    currentRoleTitle: 'Senior HR Operations Specialist',
    currentLocationId: 'loc-ny-001',
    currentLocationName: 'New York Flagship Office',
    managerId: 'exec-002'
  },
  {
    id: 'it-spec-001',
    name: 'Frank IT Specialist',
    email: 'frank@company.com',
    employeeCode: 'IT1001',
    role: UserRole.IT_SPECIALIST,
    currentDepartmentId: 'dept-it-001',
    currentDepartmentName: 'IT Operations',
    currentRoleId: 'role-it-001',
    currentRoleTitle: 'IT Provisioning Specialist',
    currentLocationId: 'loc-austin-001',
    currentLocationName: 'Austin Campus',
    managerId: 'exec-003'
  }
];

export function App() {
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]);
  const [activeTab, setActiveTab] = useState<'INITIATE' | 'MY_JOURNEY' | 'APPROVALS' | 'DOWNSTREAM'>('INITIATE');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // App state
  const [activeRequest, setActiveRequest] = useState<TransferRequest | null>(null);
  const [draftData, setDraftData] = useState<Partial<TransferFormData> | null>(null);
  const [allRequests, setAllRequests] = useState<TransferRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [downstreamTasks, setDownstreamTasks] = useState<DownstreamTask[]>([]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Seed sample request
  useEffect(() => {
    const sampleRequest: TransferRequest = {
      id: 'TR-2026-9042',
      employeeId: USERS[0].id,
      employeeName: USERS[0].name,
      employeeCode: USERS[0].employeeCode,
      currentDepartmentId: USERS[0].currentDepartmentId,
      currentDepartmentName: USERS[0].currentDepartmentName,
      targetDepartmentId: 'dept-cloud-001',
      targetDepartmentName: 'Cloud Infrastructure',
      currentRoleId: USERS[0].currentRoleId,
      currentRoleTitle: USERS[0].currentRoleTitle,
      targetRoleId: 'role-sre-001',
      targetRoleTitle: 'Site Reliability Engineer',
      currentLocationId: USERS[0].currentLocationId,
      currentLocationName: USERS[0].currentLocationName,
      targetLocationId: 'loc-austin-001',
      targetLocationName: 'Austin Campus',
      currentManagerId: USERS[1].id,
      targetManagerId: USERS[2].id,
      effectiveDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reason: 'Transitioning to multi-region cloud operations to manage distributed reliability engineering.',
      status: TransferStatus.PENDING_CURRENT_MGR,
      version: 1,
      submittedAt: new Date().toISOString()
    };

    setActiveRequest(sampleRequest);
    setAllRequests([sampleRequest]);
    setAuditLogs([
      {
        id: 'log-001',
        transferRequestId: sampleRequest.id,
        actorId: USERS[0].id,
        actorRole: USERS[0].role,
        action: 'SUBMIT_TRANSFER',
        newStatus: TransferStatus.PENDING_CURRENT_MGR,
        timestampUTC: new Date().toISOString()
      }
    ]);
  }, []);

  // Submit transfer handler
  const handleTransferSubmit = async (formData: TransferFormData) => {
    if (activeRequest && activeRequest.status !== TransferStatus.COMPLETED && activeRequest.status !== TransferStatus.REJECTED && activeRequest.status !== TransferStatus.WITHDRAWN) {
      throw new Error(`Active request constraint (AC02): Request ${activeRequest.id} is already in progress.`);
    }

    const newRequest: TransferRequest = {
      id: `TR-${Date.now().toString().slice(-6)}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeCode: currentUser.employeeCode,
      currentDepartmentId: currentUser.currentDepartmentId,
      currentDepartmentName: currentUser.currentDepartmentName,
      targetDepartmentId: formData.targetDepartmentId,
      targetDepartmentName: formData.targetDepartmentName,
      currentRoleId: currentUser.currentRoleId,
      currentRoleTitle: currentUser.currentRoleTitle,
      targetRoleId: formData.targetRoleId,
      targetRoleTitle: formData.targetRoleTitle,
      currentLocationId: currentUser.currentLocationId,
      currentLocationName: currentUser.currentLocationName,
      targetLocationId: formData.targetLocationId,
      targetLocationName: formData.targetLocationName,
      currentManagerId: currentUser.managerId,
      targetManagerId: formData.targetManagerId,
      effectiveDate: formData.effectiveDate,
      reason: formData.reason,
      status: TransferStatus.PENDING_CURRENT_MGR,
      version: 1,
      submittedAt: new Date().toISOString()
    };

    setActiveRequest(newRequest);
    setAllRequests(prev => [newRequest, ...prev]);
    setDraftData(null);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      transferRequestId: newRequest.id,
      actorId: currentUser.id,
      actorRole: currentUser.role,
      action: 'SUBMIT_TRANSFER',
      newStatus: TransferStatus.PENDING_CURRENT_MGR,
      timestampUTC: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);

    showToast('success', `Transfer request ${newRequest.id} initiated! Pending Current Manager review.`);
    setActiveTab('MY_JOURNEY');
  };

  // Draft save handler
  const handleDraftSave = async (data: Partial<TransferFormData>) => {
    setDraftData(data);
    showToast('success', 'Application draft saved. You can safely return to edit later.');
  };

  // Voluntary withdrawal handler (AC10)
  const handleWithdraw = async (reason: string) => {
    if (!activeRequest) return;

    const updated = {
      ...activeRequest,
      status: TransferStatus.WITHDRAWN,
      version: activeRequest.version + 1
    };

    setActiveRequest(updated);
    setAllRequests(prev => prev.map(r => r.id === updated.id ? updated : r));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      transferRequestId: updated.id,
      actorId: currentUser.id,
      actorRole: currentUser.role,
      action: `VOLUNTARY_WITHDRAWAL: ${reason}`,
      previousStatus: activeRequest.status,
      newStatus: TransferStatus.WITHDRAWN,
      timestampUTC: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);

    showToast('success', `Transfer request ${updated.id} withdrawn successfully.`);
  };

  // Approval decision handler (AC04, AC05, AC06, AC07)
  const handleApprovalDecision = async (requestId: string, decision: 'APPROVE' | 'REJECT', justification?: string) => {
    const target = allRequests.find(r => r.id === requestId);
    if (!target) return;

    let nextStatus: TransferStatus;
    if (decision === 'REJECT') {
      nextStatus = TransferStatus.REJECTED;
    } else {
      if (target.status === TransferStatus.PENDING_CURRENT_MGR) nextStatus = TransferStatus.PENDING_NEW_MGR;
      else if (target.status === TransferStatus.PENDING_NEW_MGR) nextStatus = TransferStatus.PENDING_HR;
      else if (target.status === TransferStatus.PENDING_HR) nextStatus = TransferStatus.PROCESSING_DOWNSTREAM;
      else nextStatus = TransferStatus.COMPLETED;
    }

    const updated: TransferRequest = {
      ...target,
      status: nextStatus,
      version: target.version + 1
    };

    // If HR approves, spawn downstream tasks (AC06)
    if (decision === 'APPROVE' && target.status === TransferStatus.PENDING_HR) {
      const now = Date.now();
      const slaDeadline = new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString();
      const spawnedTasks: DownstreamTask[] = [
        {
          id: `TASK-IT-${target.id.slice(-4)}`,
          transferRequestId: target.id,
          taskType: DownstreamTaskType.IT_PROVISIONING,
          status: DownstreamTaskStatus.PENDING,
          assignedRole: UserRole.IT_SPECIALIST,
          slaDeadline,
          slaBreached: false
        },
        {
          id: `TASK-PAY-${target.id.slice(-4)}`,
          transferRequestId: target.id,
          taskType: DownstreamTaskType.PAYROLL_UPDATE,
          status: DownstreamTaskStatus.PENDING,
          assignedRole: UserRole.PAYROLL_SPECIALIST,
          slaDeadline,
          slaBreached: false
        },
        {
          id: `TASK-FAC-${target.id.slice(-4)}`,
          transferRequestId: target.id,
          taskType: DownstreamTaskType.FACILITIES_ALLOCATION,
          status: DownstreamTaskStatus.PENDING,
          assignedRole: UserRole.FACILITIES_SPECIALIST,
          slaDeadline,
          slaBreached: false
        }
      ];
      setDownstreamTasks(prev => [...spawnedTasks, ...prev]);
    }

    setAllRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
    if (activeRequest?.id === updated.id) {
      setActiveRequest(updated);
    }

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      transferRequestId: updated.id,
      actorId: currentUser.id,
      actorRole: currentUser.role,
      action: decision === 'APPROVE' ? `APPROVAL_GRANTED by ${currentUser.name}` : `REJECTED: ${justification}`,
      previousStatus: target.status,
      newStatus: updated.status,
      timestampUTC: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);

    showToast('success', `Decision recorded: ${decision} (${nextStatus.replace(/_/g, ' ')})`);
  };

  // Downstream task status update (AC08, AC09)
  const handleTaskUpdate = async (taskId: string, status: DownstreamTaskStatus, notes?: string) => {
    setDownstreamTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, status, notes: notes || t.notes } : t);

      // Check if all tasks for active request are completed (AC09)
      if (activeRequest && activeRequest.status === TransferStatus.PROCESSING_DOWNSTREAM) {
        const related = updated.filter(t => t.transferRequestId === activeRequest.id);
        const allDone = related.length === 3 && related.every(t => t.status === DownstreamTaskStatus.COMPLETED);
        if (allDone) {
          const completedReq = { ...activeRequest, status: TransferStatus.COMPLETED, version: activeRequest.version + 1 };
          setActiveRequest(completedReq);
          setAllRequests(all => all.map(r => r.id === completedReq.id ? completedReq : r));
          showToast('success', `All downstream tasks finalized! Request ${activeRequest.id} is COMPLETED.`);
        }
      }

      return updated;
    });

    showToast('success', `Fulfillment task updated to ${status}`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', width: '100%' }}>
      {/* Top Navbar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)'
          }}>
            ⇄
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              INT Mobility Hub
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Employee Internal Transfer Digital Journey • SDD Enterprise Policy
            </p>
          </div>
        </div>

        {/* Persona Switcher for pair-programming & verification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Viewing as Persona:</span>
          <select
            className="form-select"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', width: 'auto', background: 'rgba(30, 41, 59, 0.9)' }}
            value={currentUser.id}
            onChange={(e) => {
              const selected = USERS.find(u => u.id === e.target.value);
              if (selected) {
                setCurrentUser(selected);
                showToast('success', `Switched session to ${selected.name} (${selected.role})`);
              }
            }}
          >
            {USERS.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} — [{u.role}]
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          padding: '0.85rem 1.35rem',
          borderRadius: 'var(--radius-md)',
          background: toast.type === 'success' ? '#065f46' : '#991b1b',
          color: '#ffffff',
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 1000,
          border: '1px solid rgba(255,255,255,0.2)',
          animation: 'fadeIn 0.2s ease-in'
        }}>
          {toast.message}
        </div>
      )}

      {/* Portal Tab Navigation */}
      <nav style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.75rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.5rem',
        overflowX: 'auto'
      }}>
        <button
          type="button"
          className={`btn ${activeTab === 'INITIATE' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('INITIATE')}
        >
          📝 Initiate Transfer
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'MY_JOURNEY' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('MY_JOURNEY')}
        >
          🧭 Journey Timeline {activeRequest && `(#${activeRequest.id.slice(-4)})`}
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'APPROVALS' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('APPROVALS')}
        >
          ⚖️ Multi-Gate Approvals
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'DOWNSTREAM' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('DOWNSTREAM')}
        >
          ⚡ Downstream Worklist ({downstreamTasks.length})
        </button>
      </nav>

      {/* Main Tab Content */}
      <main>
        {activeTab === 'INITIATE' && (
          <TransferInitiationForm
            currentUser={currentUser}
            initialData={draftData || undefined}
            onSubmit={handleTransferSubmit}
            onSaveDraft={handleDraftSave}
          />
        )}

        {activeTab === 'MY_JOURNEY' && (
          activeRequest ? (
            <TransferDetailView
              transfer={activeRequest}
              auditLogs={auditLogs.filter(l => l.transferRequestId === activeRequest.id)}
              downstreamTasks={downstreamTasks.filter(t => t.transferRequestId === activeRequest.id)}
              currentUserId={currentUser.id}
              onWithdraw={handleWithdraw}
            />
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
              <h3>No Active Transfer Request</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                You do not have an active internal transfer request underway.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => setActiveTab('INITIATE')}>
                Start Transfer Application
              </button>
            </div>
          )
        )}

        {activeTab === 'APPROVALS' && (
          <ApprovalDashboard
            role={currentUser.role}
            requests={allRequests}
            onDecision={handleApprovalDecision}
          />
        )}

        {activeTab === 'DOWNSTREAM' && (
          <DownstreamTaskWorklist
            currentRole={currentUser.role}
            tasks={downstreamTasks}
            onUpdateStatus={handleTaskUpdate}
          />
        )}
      </main>
    </div>
  );
}

export default App;
