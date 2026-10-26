import React, { useState, useEffect } from 'react';
import { User } from '../../../shared/types';

export interface TransferFormData {
  targetDepartmentId: string;
  targetDepartmentName: string;
  targetRoleId: string;
  targetRoleTitle: string;
  targetLocationId: string;
  targetLocationName: string;
  targetManagerId: string;
  effectiveDate: string;
  reason: string;
}

interface Props {
  currentUser: Partial<User>;
  initialData?: Partial<TransferFormData>;
  onSubmit: (data: TransferFormData) => Promise<void>;
  onSaveDraft: (data: Partial<TransferFormData>) => Promise<void>;
}

const DEPARTMENTS = [
  { id: 'dept-cloud-001', name: 'Cloud & Infrastructure' },
  { id: 'dept-eng-001', name: 'Software Engineering' },
  { id: 'dept-ai-001', name: 'AI & Machine Learning' },
  { id: 'dept-sec-001', name: 'Cybersecurity & Compliance' },
  { id: 'dept-prod-001', name: 'Product Management' }
];

const ROLES = [
  { id: 'role-sre-001', title: 'Site Reliability Engineer' },
  { id: 'role-dev-002', title: 'Senior Full Stack Engineer' },
  { id: 'role-ai-001', title: 'AI Solutions Architect' },
  { id: 'role-sec-001', title: 'Security Operations Analyst' },
  { id: 'role-pm-001', title: 'Lead Product Specialist' }
];

const LOCATIONS = [
  { id: 'loc-austin-001', name: 'Austin Technology Campus, TX' },
  { id: 'loc-ny-001', name: 'New York Flagship Office, NY' },
  { id: 'loc-sf-001', name: 'San Francisco Innovation Hub, CA' },
  { id: 'loc-lon-001', name: 'London Tech Square, UK' }
];

const MANAGERS = [
  { id: 'mgr-target-001', name: 'Carol TargetManager (Cloud Eng Lead)' },
  { id: 'mgr-sec-001', name: 'Marcus Vance (Cybersecurity Director)' },
  { id: 'mgr-ai-001', name: 'Elena Rostova (AI Team Lead)' }
];

export const TransferInitiationForm: React.FC<Props> = ({
  currentUser,
  initialData,
  onSubmit,
  onSaveDraft
}) => {
  const [formData, setFormData] = useState<TransferFormData>({
    targetDepartmentId: initialData?.targetDepartmentId || DEPARTMENTS[0].id,
    targetDepartmentName: initialData?.targetDepartmentName || DEPARTMENTS[0].name,
    targetRoleId: initialData?.targetRoleId || ROLES[0].id,
    targetRoleTitle: initialData?.targetRoleTitle || ROLES[0].title,
    targetLocationId: initialData?.targetLocationId || LOCATIONS[0].id,
    targetLocationName: initialData?.targetLocationName || LOCATIONS[0].name,
    targetManagerId: initialData?.targetManagerId || MANAGERS[0].id,
    effectiveDate: initialData?.effectiveDate || '',
    reason: initialData?.reason || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Compute notice period days
  const calculateDaysInFuture = (dateStr: string): number => {
    if (!dateStr) return 0;
    const target = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.targetDepartmentId) {
      newErrors.targetDepartment = 'Target department is required.';
    }

    if (!formData.targetRoleId) {
      newErrors.targetRole = 'Target role is required.';
    }

    if (!formData.targetLocationId) {
      newErrors.targetLocation = 'Target location is required.';
    }

    if (!formData.targetManagerId) {
      newErrors.targetManager = 'Target receiving manager is required.';
    } else if (currentUser?.id && formData.targetManagerId === currentUser.id) {
      newErrors.targetManager = 'Self-transfer prevented: Receiving manager cannot equal applicant ID.';
    }

    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'Requested effective date is mandatory.';
    } else {
      const days = calculateDaysInFuture(formData.effectiveDate);
      if (days < 14) {
        newErrors.effectiveDate = `Notice period violation: Effective date must be at least 14 calendar days in future (Currently: ${days} days).`;
      }
    }

    if (!formData.reason || formData.reason.trim().length < 20) {
      newErrors.reason = `Business justification must be at least 20 characters (Currently: ${formData.reason.trim().length} chars).`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!validate()) {
      setStatusMessage({ type: 'error', text: 'Please correct the validation errors below.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setStatusMessage({ type: 'success', text: 'Transfer request submitted successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to submit transfer request.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsDraftSaving(true);
    setStatusMessage(null);
    try {
      await onSaveDraft(formData);
      setStatusMessage({ type: 'success', text: 'Draft application saved successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to save draft.' });
    } finally {
      setIsDraftSaving(false);
    }
  };

  const daysAhead = calculateDaysInFuture(formData.effectiveDate);

  return (
    <div className="glass-card" data-testid="transfer-form">
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Initiate Internal Transfer Request</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Explore lateral mobility within INT. Ensure minimum 14-day advance notice for operational transition.
        </p>
      </div>

      {/* Applicant Current Snapshot */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.4)',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        border: '1px solid var(--border)'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Applicant</span>
          <div style={{ fontWeight: 600 }}>{currentUser?.name || 'Applicant Employee'}</div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Dept</span>
          <div style={{ fontWeight: 600 }}>{currentUser?.currentDepartmentName || 'Software Engineering'}</div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Role</span>
          <div style={{ fontWeight: 600 }}>{currentUser?.currentRoleTitle || 'Full Stack Engineer'}</div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Location</span>
          <div style={{ fontWeight: 600 }}>{currentUser?.currentLocationName || 'New York'}</div>
        </div>
      </div>

      {statusMessage && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          backgroundColor: statusMessage.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: statusMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Target Department */}
          <div className="form-group">
            <label className="form-label" htmlFor="targetDepartment">Target Department</label>
            <select
              id="targetDepartment"
              className="form-select"
              value={formData.targetDepartmentId}
              onChange={(e) => {
                const selected = DEPARTMENTS.find(d => d.id === e.target.value);
                setFormData({
                  ...formData,
                  targetDepartmentId: e.target.value,
                  targetDepartmentName: selected ? selected.name : ''
                });
              }}
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            {errors.targetDepartment && <div className="form-error">{errors.targetDepartment}</div>}
          </div>

          {/* Target Role */}
          <div className="form-group">
            <label className="form-label" htmlFor="targetRole">Target Role</label>
            <select
              id="targetRole"
              className="form-select"
              value={formData.targetRoleId}
              onChange={(e) => {
                const selected = ROLES.find(r => r.id === e.target.value);
                setFormData({
                  ...formData,
                  targetRoleId: e.target.value,
                  targetRoleTitle: selected ? selected.title : ''
                });
              }}
            >
              {ROLES.map(role => (
                <option key={role.id} value={role.id}>{role.title}</option>
              ))}
            </select>
            {errors.targetRole && <div className="form-error">{errors.targetRole}</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Target Location */}
          <div className="form-group">
            <label className="form-label" htmlFor="targetLocation">Target Location</label>
            <select
              id="targetLocation"
              className="form-select"
              value={formData.targetLocationId}
              onChange={(e) => {
                const selected = LOCATIONS.find(l => l.id === e.target.value);
                setFormData({
                  ...formData,
                  targetLocationId: e.target.value,
                  targetLocationName: selected ? selected.name : ''
                });
              }}
            >
              {LOCATIONS.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            {errors.targetLocation && <div className="form-error">{errors.targetLocation}</div>}
          </div>

          {/* Target Manager */}
          <div className="form-group">
            <label className="form-label" htmlFor="targetManager">Target Receiving Manager</label>
            <select
              id="targetManager"
              className="form-select"
              value={formData.targetManagerId}
              onChange={(e) => setFormData({ ...formData, targetManagerId: e.target.value })}
            >
              {MANAGERS.map(mgr => (
                <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
              ))}
            </select>
            {errors.targetManager && <div className="form-error">{errors.targetManager}</div>}
          </div>
        </div>

        {/* Effective Date with Real-time Notice Period Validation */}
        <div className="form-group">
          <label className="form-label" htmlFor="effectiveDate">
            Requested Effective Date <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Minimum 14 calendar days required)</span>
          </label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              id="effectiveDate"
              type="date"
              className="form-input"
              style={{ maxWidth: '280px' }}
              value={formData.effectiveDate}
              onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
            />
            {formData.effectiveDate && (
              <span className={`badge ${daysAhead >= 14 ? 'badge-approved' : 'badge-rejected'}`}>
                {daysAhead >= 14 ? `✓ Valid Notice (${daysAhead} days)` : `⚠ Insufficient Notice (${daysAhead} days)`}
              </span>
            )}
          </div>
          {errors.effectiveDate && <div className="form-error">{errors.effectiveDate}</div>}
        </div>

        {/* Business Justification */}
        <div className="form-group">
          <label className="form-label" htmlFor="reason">
            Business Justification & Career Objective <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Min 20 characters)</span>
          </label>
          <textarea
            id="reason"
            rows={4}
            className="form-textarea"
            placeholder="Explain the motivation for the transfer, relevant skills for the new role, and transition handover strategy..."
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            {errors.reason ? (
              <div className="form-error">{errors.reason}</div>
            ) : <span />}
            <span style={{ fontSize: '0.8rem', color: formData.reason.length >= 20 ? 'var(--success)' : 'var(--text-muted)' }}>
              {formData.reason.length} / 20 characters
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSaveDraft}
            disabled={isDraftSaving || isSubmitting}
          >
            {isDraftSaving ? 'Saving Draft...' : 'Save Draft'}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isDraftSaving}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Transfer'}
          </button>
        </div>
      </form>
    </div>
  );
};
