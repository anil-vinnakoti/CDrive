'use client';

import React, { useRef } from 'react';
import { UploadCloud, FileUp, Loader, X } from 'lucide-react';

interface UploadModalProps {
  show: boolean;
  selectedFile: File | null;
  isUploading: boolean;
  uploadProgress: number;
  uploadStatus: string;
  onSelectFile: (file: File | null) => void;
  onStartUpload: () => void;
  onClose: () => void;
  formatFileSize: (bytes?: number) => string;
}

export function UploadModal({
  show,
  selectedFile,
  isUploading,
  uploadProgress,
  uploadStatus,
  onSelectFile,
  onStartUpload,
  onClose,
  formatFileSize
}: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6 rounded-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Upload File
          </h3>
          <button onClick={onClose} title="Close upload modal" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          title="Click to select file from disk"
          className="border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl p-8 text-center cursor-pointer flex flex-col items-center gap-3 transition-colors"
        >
          <FileUp className="w-10 h-10 text-zinc-500 dark:text-zinc-400" />
          <p className="font-medium text-xs text-zinc-800 dark:text-zinc-200">Click or drag file here to upload</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">PDF, Images, DOCX, Code, Audio, Video</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onSelectFile(e.target.files[0]);
              }
            }}
          />
        </div>

        {selectedFile && (
          <div className="flex flex-col gap-2 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between text-xs font-medium text-zinc-800 dark:text-zinc-200">
              <span className="truncate">{selectedFile.name}</span>
              <span className="text-zinc-500 dark:text-zinc-400 font-mono">{formatFileSize(selectedFile.size)}</span>
            </div>
            {uploadProgress > 0 && (
              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
            {uploadStatus && <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">{uploadStatus}</span>}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button onClick={onClose} title="Cancel upload" className="py-2 px-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-medium cursor-pointer">Cancel</button>
          <button
            onClick={onStartUpload}
            disabled={!selectedFile || isUploading}
            title="Start S3 file upload"
            className="py-2 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 text-zinc-100 dark:text-zinc-950 font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isUploading && <Loader className="w-4 h-4 spin" />}
            <span>Start Upload</span>
          </button>
        </div>
      </div>
    </div>
  );
}
