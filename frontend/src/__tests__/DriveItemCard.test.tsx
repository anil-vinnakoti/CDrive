import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DriveItemCard } from '../components/DriveItemCard';
import { DriveItem } from '../lib/api';

const mockFileItem: DriveItem = {
  id: 'FILE-100',
  userId: 'user-1',
  name: 'financial_report.pdf',
  type: 'FILE',
  size: 2048576,
  mimeType: 'application/pdf',
  isFavorite: false,
  isTrashed: false,
  createdAt: '2026-07-23T12:00:00Z',
  updatedAt: '2026-07-23T12:00:00Z',
};

const mockFolderItem: DriveItem = {
  id: 'FOLDER-200',
  userId: 'user-1',
  name: 'Projects',
  type: 'FOLDER',
  isFavorite: true,
  isTrashed: false,
  createdAt: '2026-07-23T12:00:00Z',
  updatedAt: '2026-07-23T12:00:00Z',
};

describe('DriveItemCard Component', () => {
  const formatFileSize = (bytes?: number) => `${(bytes || 0) / 1024 / 1024} MB`;

  it('renders file card details correctly', () => {
    render(
      <DriveItemCard
        item={mockFileItem}
        activeTab="my-drive"
        onOpenFolder={vi.fn()}
        onOpenPreview={vi.fn()}
        onToggleFavorite={vi.fn()}
        onToggleTrash={vi.fn()}
        onPermanentDelete={vi.fn()}
        formatFileSize={formatFileSize}
      />
    );

    expect(screen.getByText('financial_report.pdf')).toBeInTheDocument();
    expect(screen.getAllByText(/pdf/i).length).toBeGreaterThan(0);
  });

  it('triggers onOpenPreview when clicking a file card', () => {
    const handlePreview = vi.fn();

    render(
      <DriveItemCard
        item={mockFileItem}
        activeTab="my-drive"
        onOpenFolder={vi.fn()}
        onOpenPreview={handlePreview}
        onToggleFavorite={vi.fn()}
        onToggleTrash={vi.fn()}
        onPermanentDelete={vi.fn()}
        formatFileSize={formatFileSize}
      />
    );

    fireEvent.click(screen.getByText('financial_report.pdf'));
    expect(handlePreview).toHaveBeenCalledWith(mockFileItem);
  });

  it('triggers onOpenFolder when clicking a folder card', () => {
    const handleOpenFolder = vi.fn();

    render(
      <DriveItemCard
        item={mockFolderItem}
        activeTab="my-drive"
        onOpenFolder={handleOpenFolder}
        onOpenPreview={vi.fn()}
        onToggleFavorite={vi.fn()}
        onToggleTrash={vi.fn()}
        onPermanentDelete={vi.fn()}
        formatFileSize={formatFileSize}
      />
    );

    fireEvent.click(screen.getByText('Projects'));
    expect(handleOpenFolder).toHaveBeenCalledWith(mockFolderItem);
  });

  it('renders Restore and Delete Permanently buttons when activeTab is trash', () => {
    const handleTrash = vi.fn();
    const handlePermanentDelete = vi.fn();

    const trashedItem = { ...mockFileItem, isTrashed: true };

    render(
      <DriveItemCard
        item={trashedItem}
        activeTab="trash"
        onOpenFolder={vi.fn()}
        onOpenPreview={vi.fn()}
        onToggleFavorite={vi.fn()}
        onToggleTrash={handleTrash}
        onPermanentDelete={handlePermanentDelete}
        formatFileSize={formatFileSize}
      />
    );

    const restoreBtn = screen.getByTitle('Restore from Trash');
    const deleteBtn = screen.getByTitle('Delete Permanently');

    expect(restoreBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(restoreBtn);
    expect(handleTrash).toHaveBeenCalledWith(trashedItem, false, expect.any(Object));

    fireEvent.click(deleteBtn);
    expect(handlePermanentDelete).toHaveBeenCalledWith(trashedItem, expect.any(Object));
  });
});
