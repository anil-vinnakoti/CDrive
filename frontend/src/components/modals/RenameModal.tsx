'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, X } from 'lucide-react';
import { DriveItem } from '@/lib/api';

interface RenameModalProps {
  show: boolean;
  item: DriveItem | null;
  onClose: () => void;
  onRename: (item: DriveItem, newName: string) => void;
}

export function RenameModal({ show, item, onClose, onRename }: RenameModalProps) {
  const [name, setName] = useState<string>('');

  useEffect(() => {
    if (item) {
      setName(item.name || '');
    }
  }, [item]);

  if (!show || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== item.name) {
      onRename(item, name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6 rounded-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Rename {item.type === 'FOLDER' ? 'Folder' : 'File'}
          </h3>
          <button type="button" onClick={onClose} title="Close modal" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-700"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button type="button" onClick={onClose} title="Cancel rename" className="py-2 px-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-medium cursor-pointer">Cancel</button>
          <button type="submit" disabled={!name.trim() || name.trim() === item.name} title="Save new name" className="py-2 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 text-zinc-100 dark:text-zinc-950 font-medium text-xs transition-colors cursor-pointer">Save</button>
        </div>
      </form>
    </div>
  );
}
