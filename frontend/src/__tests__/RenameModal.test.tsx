import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RenameModal } from '../components/modals/RenameModal';
import { DriveItem } from '../lib/api';

const mockFileItem: DriveItem = {
  id: 'FILE-100',
  userId: 'user-1',
  name: 'quarterly_budget.xlsx',
  type: 'FILE',
  size: 50000,
  isFavorite: false,
  isTrashed: false,
  createdAt: '2026-07-23T12:00:00Z',
  updatedAt: '2026-07-23T12:00:00Z',
};

describe('RenameModal Subcomponent', () => {
  it('renders modal pre-populated with item name', () => {
    render(
      <RenameModal
        show={true}
        item={mockFileItem}
        onClose={vi.fn()}
        onRename={vi.fn()}
      />
    );

    expect(screen.getByText('Rename File')).toBeInTheDocument();
    const input = screen.getByDisplayValue('quarterly_budget.xlsx');
    expect(input).toBeInTheDocument();
  });

  it('invokes onRename callback when submitted with a new name', () => {
    const handleRename = vi.fn();

    render(
      <RenameModal
        show={true}
        item={mockFileItem}
        onClose={vi.fn()}
        onRename={handleRename}
      />
    );

    const input = screen.getByDisplayValue('quarterly_budget.xlsx');
    fireEvent.change(input, { target: { value: 'q3_budget_final.xlsx' } });

    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);

    expect(handleRename).toHaveBeenCalledWith(mockFileItem, 'q3_budget_final.xlsx');
  });

  it('disables Save button if name is unchanged or blank', () => {
    render(
      <RenameModal
        show={true}
        item={mockFileItem}
        onClose={vi.fn()}
        onRename={vi.fn()}
      />
    );

    const saveBtn = screen.getByText('Save');
    expect(saveBtn).toBeDisabled();
  });
});
