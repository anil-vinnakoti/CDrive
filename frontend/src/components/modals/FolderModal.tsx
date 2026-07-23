'use client';

import React from 'react';
import { FolderPlus, X } from 'lucide-react';

interface FolderModalProps {
  show: boolean;
  newFolderName: string;
  onChangeName: (name: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

export function FolderModal({ show, newFolderName, onChangeName, onClose, onCreate }: FolderModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6 rounded-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Create New Folder
          </h3>
          <button onClick={onClose} title="Close modal" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Folder Name</label>
          <input
            type="text"
            placeholder="e.g. Documents, Photographs, Projects"
            value={newFolderName}
            onChange={(e) => onChangeName(e.target.value)}
            autoFocus
            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-700"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button onClick={onClose} title="Cancel folder creation" className="py-2 px-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-medium cursor-pointer">Cancel</button>
          <button onClick={onCreate} title="Create folder" className="py-2 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-950 font-medium text-xs transition-colors cursor-pointer">Create Folder</button>
        </div>
      </div>
    </div>
  );
}
