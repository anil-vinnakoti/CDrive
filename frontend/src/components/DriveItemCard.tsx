'use client';

import React from 'react';
import {
  FolderOpen, Star, RefreshCw, Trash2, FileText, Image as ImageIcon,
  Music, Video, Code2, File, FileType2
} from 'lucide-react';
import { DriveItem } from '@/lib/api';

interface DriveItemCardProps {
  item: DriveItem;
  activeTab: 'my-drive' | 'recent' | 'favorites' | 'trash';
  thumbUrl?: string;
  onOpenFolder: (folder: DriveItem) => void;
  onOpenPreview: (file: DriveItem) => void;
  onToggleFavorite: (item: DriveItem, e: React.MouseEvent) => void;
  onToggleTrash: (item: DriveItem, isTrashAction: boolean, e: React.MouseEvent) => void;
  onPermanentDelete: (item: DriveItem, e: React.MouseEvent) => void;
  formatFileSize: (bytes?: number) => string;
}

const getFileIcon = (item: DriveItem) => {
  if (item.type === 'FOLDER') return <FolderOpen className="w-6 h-6 text-zinc-800 dark:text-zinc-100" />;
  const mime = (item.mimeType || '').toLowerCase();
  const ext = (item.name || '').split('.').pop()?.toLowerCase();

  if (mime.includes('pdf') || ext === 'pdf') return <FileText className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />;
  if (mime.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) return <ImageIcon className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />;
  if (mime.includes('word') || ['doc', 'docx', 'txt'].includes(ext || '')) return <FileType2 className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />;
  if (mime.includes('code') || ['js', 'ts', 'go', 'py', 'json', 'html', 'css'].includes(ext || '')) return <Code2 className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />;
  if (mime.includes('audio') || ['mp3', 'wav'].includes(ext || '')) return <Music className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />;
  if (mime.includes('video') || ['mp4', 'webm'].includes(ext || '')) return <Video className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />;

  return <File className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />;
};

export const DriveItemCard = React.memo(function DriveItemCard({
  item,
  activeTab,
  thumbUrl,
  onOpenFolder,
  onOpenPreview,
  onToggleFavorite,
  onToggleTrash,
  onPermanentDelete,
  formatFileSize
}: DriveItemCardProps) {
  const mime = (item.mimeType || '').toLowerCase();
  const ext = (item.name || '').split('.').pop()?.toLowerCase() || '';
  const isImage = mime.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext);
  const isPdf = mime.includes('pdf') || ext === 'pdf';

  return (
    <div
      onClick={() => item.type === 'FOLDER' ? onOpenFolder(item) : onOpenPreview(item)}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-3 group hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors cursor-pointer relative"
    >
      {/* Visual Card Header */}
      {item.type === 'FOLDER' ? (
        <div className="flex items-center justify-between">
          <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-zinc-800 dark:text-zinc-100" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => onToggleFavorite(item, e)}
              title={item.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${item.isFavorite ? 'text-zinc-900 dark:text-zinc-100 opacity-100' : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100'}`}
            >
              <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-zinc-900 dark:fill-zinc-100' : ''}`} />
            </button>
            {activeTab === 'trash' ? (
              <>
                <button onClick={(e) => onToggleTrash(item, false, e)} title="Restore from Trash" className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 cursor-pointer"><RefreshCw className="w-4 h-4" /></button>
                <button onClick={(e) => onPermanentDelete(item, e)} title="Delete Permanently" className="p-1.5 text-rose-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </>
            ) : (
              <button onClick={(e) => onToggleTrash(item, true, e)} title="Move to Trash" className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between z-10">
            <div className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono text-zinc-700 dark:text-zinc-300 uppercase">
              {ext || 'FILE'}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => onToggleFavorite(item, e)}
                title={item.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${item.isFavorite ? 'text-zinc-900 dark:text-zinc-100 opacity-100' : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100'}`}
              >
                <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-zinc-900 dark:fill-zinc-100' : ''}`} />
              </button>
              {activeTab === 'trash' ? (
                <>
                  <button onClick={(e) => onToggleTrash(item, false, e)} title="Restore from Trash" className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 cursor-pointer"><RefreshCw className="w-4 h-4" /></button>
                  <button onClick={(e) => onPermanentDelete(item, e)} title="Delete Permanently" className="p-1.5 text-rose-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </>
              ) : (
                <button onClick={(e) => onToggleTrash(item, true, e)} title="Move to Trash" className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          </div>

          {/* Thumbnail Preview */}
          <div className="h-32 w-full rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center relative group-hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
            {isImage && thumbUrl ? (
              <img src={thumbUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : isPdf && thumbUrl ? (
              <div className="w-full h-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-950 pointer-events-none flex items-center justify-center">
                <object
                  data={`${thumbUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0`}
                  type="application/pdf"
                  className="w-full h-[180px] pointer-events-none border-none opacity-85 scale-90 -mt-2"
                >
                  <div className="flex flex-col items-center gap-1.5 p-2">
                    <FileText className="w-7 h-7 text-zinc-700 dark:text-zinc-300" />
                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">PDF</span>
                  </div>
                </object>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {getFileIcon(item)}
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{ext || 'FILE'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 pt-1">
        <span className="font-medium text-xs text-zinc-800 dark:text-zinc-200 truncate" title={item.name}>{item.name}</span>
        <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
          <span>{item.type === 'FOLDER' ? 'Folder' : formatFileSize(item.size)}</span>
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
});
