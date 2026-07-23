'use client';

import React from 'react';
import { File, X, Loader, Music, FileText, Cloud, Download } from 'lucide-react';
import { DriveItem } from '@/lib/api';

interface PreviewModalProps {
  show: boolean;
  previewItem: DriveItem | null;
  downloadUrl: string;
  onClose: () => void;
  onCreateShareLink: (fileId: string) => void;
  onDownloadClick: () => void;
  formatFileSize: (bytes?: number) => string;
}

export function PreviewModal({
  show,
  previewItem,
  downloadUrl,
  onClose,
  onCreateShareLink,
  onDownloadClick,
  formatFileSize
}: PreviewModalProps) {
  if (!show || !previewItem) return null;

  const mime = (previewItem.mimeType || '').toLowerCase();
  const ext = (previewItem.name || '').split('.').pop()?.toLowerCase() || '';

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl p-6 rounded-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2 truncate">
            <File className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> {previewItem.name}
          </h3>
          <button onClick={onClose} title="Close preview" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px]">
          {!downloadUrl ? (
            <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 py-12">
              <Loader className="w-5 h-5 spin text-zinc-800 dark:text-zinc-200" />
              <span className="text-xs">Loading live preview...</span>
            </div>
          ) : (() => {
            if (mime.includes('pdf') || ext === 'pdf') {
              return (
                <iframe
                  src={downloadUrl}
                  title={previewItem.name}
                  className="w-full h-[500px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                />
              );
            }

            if (mime.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
              return (
                <div className="flex items-center justify-center p-2 max-h-[500px]">
                  <img
                    src={downloadUrl}
                    alt={previewItem.name}
                    className="max-h-[460px] max-w-full rounded-lg border border-zinc-200 dark:border-zinc-800 object-contain"
                  />
                </div>
              );
            }

            if (mime.includes('video') || ['mp4', 'webm', 'mov'].includes(ext)) {
              return (
                <video controls autoPlay src={downloadUrl} className="max-h-[460px] w-full rounded-lg border border-zinc-200 dark:border-zinc-800">
                  Your browser does not support video playback.
                </video>
              );
            }

            if (mime.includes('audio') || ['mp3', 'wav', 'ogg'].includes(ext)) {
              return (
                <div className="w-full py-12 px-6 flex flex-col items-center gap-4 text-center">
                  <Music className="w-12 h-12 text-zinc-700 dark:text-zinc-300" />
                  <h4 className="font-medium text-sm text-zinc-800 dark:text-zinc-200">{previewItem.name}</h4>
                  <audio controls src={downloadUrl} className="w-full max-w-md mt-4 rounded-lg" />
                </div>
              );
            }

            return (
              <div className="py-8 px-6 text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="font-medium text-sm text-zinc-800 dark:text-zinc-200">{previewItem.name}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatFileSize(previewItem.size)} • {previewItem.mimeType || 'Document'} • Created {new Date(previewItem.createdAt).toLocaleDateString()}</p>
                <div className="w-full text-left bg-white dark:bg-zinc-900 p-4 rounded-lg font-mono text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 space-y-1 mt-2">
                  <div><strong>Item ID:</strong> {previewItem.id}</div>
                  <div><strong>S3 Key:</strong> {previewItem.s3Key || 'N/A'}</div>
                  <div><strong>Storage Class:</strong> INTELLIGENT_TIERING</div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => onCreateShareLink(previewItem.id)}
            title="Generate 24-hour public share URL"
            className="py-2 px-4 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Cloud className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Share Link
          </button>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onDownloadClick}
            title="Download file directly"
            className="py-2 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-950 font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download File
          </a>
        </div>
      </div>
    </div>
  );
}
