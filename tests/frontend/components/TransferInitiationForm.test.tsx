import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TransferInitiationForm } from '../../../src/frontend/src/modules/transfers/components/TransferInitiationForm';

describe('TransferInitiationForm Component (T11 — AC01, AC03)', () => {
  const mockUser = {
    id: 'emp-001',
    name: 'Alice Employee',
    role: 'EMPLOYEE',
    department: 'Software Engineering',
    location: 'New York'
  };

  it('should render form fields including department, role, location, effectiveDate and reason', () => {
    render(<TransferInitiationForm currentUser={mockUser} onSubmit={async () => {}} onSaveDraft={async () => {}} />);
    expect(screen.getByTestId('transfer-form')).toBeDefined();
    expect(screen.getByLabelText(/Target Department/i)).toBeDefined();
    expect(screen.getByLabelText(/Target Role/i)).toBeDefined();
    expect(screen.getByLabelText(/Target Location/i)).toBeDefined();
    expect(screen.getByLabelText(/Effective Date/i)).toBeDefined();
    expect(screen.getByLabelText(/Business Justification/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Submit Transfer/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Save Draft/i })).toBeDefined();
  });
});
