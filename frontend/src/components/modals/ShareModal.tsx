'use client';

import React from 'react';
import { Cloud, X } from 'lucide-react';

interface ShareModalProps {
  show: boolean;
  shareUrl: string;
  onClose: () => void;
  onCopy: () => void;
}

export function ShareModal({ show, shareUrl, onClose, onCopy }: ShareModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6 rounded-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Expiring Share Link
          </h3>
          <button onClick={onClose} title="Close share modal" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Anyone with this link can view & download this file. Link expires in <strong>24 hours</strong>.</p>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Public Share URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 font-mono text-xs outline-none flex-1 truncate"
            />
            <button
              onClick={onCopy}
              title="Copy URL to clipboard"
              className="py-2 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-950 font-medium text-xs transition-colors cursor-pointer"
            >
              Copy
            </button>
          </div>
        </div>
        <div className="flex justify-end pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button onClick={onClose} title="Close modal" className="py-2 px-4 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium cursor-pointer">Close</button>
        </div>
      </div>
    </div>
  );
}
