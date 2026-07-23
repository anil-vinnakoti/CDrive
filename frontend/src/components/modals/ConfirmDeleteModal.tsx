'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { DriveItem } from '@/lib/api';

interface ConfirmDeleteModalProps {
  show: boolean;
  item: DriveItem | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({ show, item, onClose, onConfirm }: ConfirmDeleteModalProps) {
  if (!show || !item) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6 rounded-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Confirm Permanent Deletion
          </h3>
          <button onClick={onClose} title="Close modal" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-300">Are you sure you want to permanently delete <strong className="text-zinc-900 dark:text-zinc-100">"{item.name}"</strong>? This will erase the file from cloud storage and cannot be undone.</p>
        <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button onClick={onClose} title="Cancel deletion" className="py-2 px-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-medium cursor-pointer">Cancel</button>
          <button onClick={onConfirm} title="Permanently delete item" className="py-2 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-950 font-medium text-xs transition-colors cursor-pointer">Delete Item</button>
        </div>
      </div>
    </div>
  );
}

interface EmptyTrashModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function EmptyTrashModal({ show, onClose, onConfirm }: EmptyTrashModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6 rounded-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Empty Trash?
          </h3>
          <button onClick={onClose} title="Close modal" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
          Are you sure you want to permanently delete all items in Trash? This will remove files from cloud storage and <strong>cannot be undone</strong>.
        </p>
        <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button onClick={onClose} title="Cancel action" className="py-2 px-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-medium cursor-pointer">Cancel</button>
          <button onClick={onConfirm} title="Confirm empty trash" className="py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors cursor-pointer">Empty Trash</button>
        </div>
      </div>
    </div>
  );
}
