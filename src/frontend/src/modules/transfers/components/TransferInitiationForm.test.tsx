import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { TransferInitiationForm } from './TransferInitiationForm';
import { UserRole } from '../../../shared/types';

describe('TransferInitiationForm Component (T11 — AC01, AC03)', () => {
  const mockUser = {
    id: 'emp-001',
    name: 'Alice Employee',
    role: UserRole.EMPLOYEE,
    department: 'Software Engineering',
    location: 'New York'
  };

  it('should render all form controls', () => {
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

  it('should display error when notice period is less than 14 days', async () => {
    const onSubmit = vi.fn();
    render(<TransferInitiationForm currentUser={mockUser} onSubmit={onSubmit} onSaveDraft={async () => {}} />);

    const dateInput = screen.getByLabelText(/Effective Date/i);
    const shortDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    fireEvent.change(dateInput, { target: { value: shortDate } });

    const submitBtn = screen.getByRole('button', { name: /Submit Transfer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Notice period violation/i)).toBeDefined();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it('should display error when justification is shorter than 20 characters', async () => {
    const onSubmit = vi.fn();
    render(<TransferInitiationForm currentUser={mockUser} onSubmit={onSubmit} onSaveDraft={async () => {}} />);

    const dateInput = screen.getByLabelText(/Effective Date/i);
    const validDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    fireEvent.change(dateInput, { target: { value: validDate } });

    const reasonInput = screen.getByLabelText(/Business Justification/i);
    fireEvent.change(reasonInput, { target: { value: 'Too short' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Transfer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Business justification must be at least 20 characters/i)).toBeDefined();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it('should call onSaveDraft when Save Draft is clicked without requiring full validation', async () => {
    const onSaveDraft = vi.fn().mockResolvedValue(undefined);
    render(<TransferInitiationForm currentUser={mockUser} onSubmit={async () => {}} onSaveDraft={onSaveDraft} />);

    const draftBtn = screen.getByRole('button', { name: /Save Draft/i });
    fireEvent.click(draftBtn);

    await waitFor(() => {
      expect(onSaveDraft).toHaveBeenCalled();
      expect(screen.getByText(/Draft application saved successfully/i)).toBeDefined();
    });
  });

  it('should submit form successfully when inputs are valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TransferInitiationForm currentUser={mockUser} onSubmit={onSubmit} onSaveDraft={async () => {}} />);

    const dateInput = screen.getByLabelText(/Effective Date/i);
    const validDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    fireEvent.change(dateInput, { target: { value: validDate } });

    const reasonInput = screen.getByLabelText(/Business Justification/i);
    fireEvent.change(reasonInput, { target: { value: 'Transferring to cloud infrastructure team to assist with distributed systems deployment.' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Transfer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
      expect(screen.getByText(/Transfer request submitted successfully/i)).toBeDefined();
    });
  });
});
