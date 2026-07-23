'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  HardDrive, Plus, FolderPlus, Clock, Star, Trash2, Cloud, Search, X,
  Moon, Sun, Key, LayoutGrid, List, RefreshCw, FolderOpen, UploadCloud,
  FileText, Image as ImageIcon, FileType2, Code2, File, Music, Video,
  Download, Trash, AlertTriangle, FileUp, Loader, CheckCircle2, AlertCircle, Info, ChevronRight
} from 'lucide-react';
import { api, DriveItem } from '@/lib/api';

interface Breadcrumb {
  id: string;
  name: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function DriveApp() {
  // Theme & Auth State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [userId, setUserId] = useState<string>('demo_user');
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('http://127.0.0.1:3000/api/v1');
  const [jwtToken, setJwtToken] = useState<string>('');
  
  // Navigation & Folder State
  const [activeTab, setActiveTab] = useState<'my-drive' | 'recent' | 'favorites' | 'trash'>('my-drive');
  const [currentFolderId, setCurrentFolderId] = useState<string>('ROOT');
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: 'ROOT', name: 'My Drive' }]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  
  // View & Filter State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  // Modal States
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  
  // Modal Form States
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [pendingDeleteItem, setPendingDeleteItem] = useState<DriveItem | null>(null);
  
  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Fetch Items from Backend
  const loadItems = useCallback(async (folderId: string = currentFolderId) => {
    setLoading(true);
    try {
      const data = await api.getItems(activeTab === 'favorites' || activeTab === 'trash' ? 'ALL' : folderId);
      const itemList = data.items || [];
      setItems(itemList);

      // Async fetch presigned thumbnail preview URLs
      itemList.forEach(async (item) => {
        if (item.type === 'FILE') {
          try {
            const res = await api.getDownloadUrl(item.id);
            setThumbnails(prev => ({ ...prev, [item.id]: res.downloadUrl }));
          } catch {
            // Ignore preview fetch errors
          }
        }
      });
    } catch (err: any) {
      showToast(`Failed to load drive items: ${err.message}`, 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, activeTab, showToast]);

  // Handle Favorite Star Toggle
  const handleToggleFavorite = async (item: DriveItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nextFav = !item.isFavorite;
      await api.toggleFavorite(item.id, item.type, nextFav);
      showToast(nextFav ? `Starred "${item.name}"` : `Unstarred "${item.name}"`, 'success');
      loadItems(currentFolderId);
    } catch (err: any) {
      showToast(`Favorite toggle failed: ${err.message}`, 'error');
    }
  };

  // Handle Soft Trash / Restore
  const handleToggleTrash = async (item: DriveItem, isTrashed: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.toggleTrash(item.id, item.type, isTrashed);
      showToast(isTrashed ? `Moved "${item.name}" to Trash` : `Restored "${item.name}"`, 'success');
      loadItems(currentFolderId);
    } catch (err: any) {
      showToast(`Trash action failed: ${err.message}`, 'error');
    }
  };

  // Handle Create Share Link
  const handleCreateShareLink = async (fileId: string) => {
    try {
      const res = await api.createShareLink(fileId, 86400); // 24 hours
      setShareUrl(res.downloadUrl);
      setShowShareModal(true);
      showToast('Generated 24-hour public share link', 'success');
    } catch (err: any) {
      showToast(`Share link generation failed: ${err.message}`, 'error');
    }
  };

  // Initial Sync
  useEffect(() => {
    setUserId(api.getUserId());
    setApiBaseUrl(api.getBaseUrl());
    setJwtToken(api.getToken());

    const initAuth = async () => {
      if (!api.getToken()) {
        try {
          const res = await api.fetchToken(api.getUserId());
          setJwtToken(res.token);
          showToast('Authenticated via JWT', 'success');
        } catch (err: any) {
          showToast(`Auth error: ${err.message}`, 'error');
        }
      }
      loadItems('ROOT');
    };

    initAuth();
  }, [loadItems, showToast]);

  // Handle Theme Toggle
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // Folder Open & Breadcrumbs
  const openFolder = (folder: DriveItem) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
    loadItems(folder.id);
  };

  const navigateBreadcrumb = (index: number) => {
    const nextBreadcrumbs = breadcrumbs.slice(0, index + 1);
    const target = nextBreadcrumbs[nextBreadcrumbs.length - 1];
    setBreadcrumbs(nextBreadcrumbs);
    setCurrentFolderId(target.id);
    loadItems(target.id);
  };

  // Create Folder Submit
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      showToast('Folder name cannot be empty', 'error');
      return;
    }
    try {
      await api.createFolder(newFolderName.trim(), currentFolderId);
      setShowFolderModal(false);
      setNewFolderName('');
      showToast(`Created folder "${newFolderName}"`, 'success');
      loadItems(currentFolderId);
    } catch (err: any) {
      showToast(`Create folder failed: ${err.message}`, 'error');
    }
  };

  // File Upload Process
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(20);
    setUploadStatus('Requesting presigned upload URL...');

    try {
      const res = await api.requestUploadUrl(selectedFile, currentFolderId);
      setUploadProgress(60);
      setUploadStatus('Uploading binary object to S3...');

      await api.uploadToS3(res.uploadUrl, selectedFile);
      setUploadProgress(100);
      setUploadStatus('Upload complete!');

      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedFile(null);
        setIsUploading(false);
        setUploadProgress(0);
        showToast(`Uploaded "${selectedFile.name}" successfully`, 'success');
        loadItems(currentFolderId);
      }, 500);

    } catch (err: any) {
      setUploadStatus(`Upload error: ${err.message}`);
      setIsUploading(false);
      showToast(`Upload failed: ${err.message}`, 'error');
    }
  };

  // Open Preview Modal
  const openPreview = async (item: DriveItem) => {
    setPreviewItem(item);
    setShowPreviewModal(true);
    setDownloadUrl('');

    try {
      const res = await api.getDownloadUrl(item.id);
      setDownloadUrl(res.downloadUrl);
    } catch (err: any) {
      console.warn('Failed to fetch download URL:', err);
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!pendingDeleteItem) return;
    try {
      await api.deleteItem(pendingDeleteItem.id, pendingDeleteItem.type);
      setShowDeleteModal(false);
      setPendingDeleteItem(null);
      showToast(`Deleted "${pendingDeleteItem.name}"`, 'success');
      loadItems(currentFolderId);
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  // Format Helpers
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (item: DriveItem) => {
    if (item.type === 'FOLDER') return <FolderOpen className="w-6 h-6 text-indigo-400" />;
    const mime = (item.mimeType || '').toLowerCase();
    const ext = (item.name || '').split('.').pop()?.toLowerCase();

    if (mime.includes('pdf') || ext === 'pdf') return <FileText className="w-6 h-6 text-rose-400" />;
    if (mime.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) return <ImageIcon className="w-6 h-6 text-emerald-400" />;
    if (mime.includes('word') || ['doc', 'docx', 'txt'].includes(ext || '')) return <FileType2 className="w-6 h-6 text-cyan-400" />;
    if (mime.includes('code') || ['js', 'ts', 'go', 'py', 'json', 'html', 'css'].includes(ext || '')) return <Code2 className="w-6 h-6 text-amber-400" />;
    if (mime.includes('audio') || ['mp3', 'wav'].includes(ext || '')) return <Music className="w-6 h-6 text-cyan-400" />;
    if (mime.includes('video') || ['mp4', 'webm'].includes(ext || '')) return <Video className="w-6 h-6 text-purple-400" />;
    
    return <File className="w-6 h-6 text-slate-400" />;
  };

  // Filter Items by Search Query and Active Tab
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'favorites') {
      return !item.isTrashed && item.isFavorite;
    }
    if (activeTab === 'trash') {
      return item.isTrashed;
    }
    if (activeTab === 'recent') {
      return !item.isTrashed;
    }

    // Default 'my-drive' tab: match folderId
    if (item.isTrashed) return false;
    return true;
  });

  const totalUsedSize = items.filter(i => i.type === 'FILE').reduce((acc, i) => acc + (i.size || 0), 0);
  const storagePct = Math.min(100, Math.max(5, (totalUsedSize / (50 * 1024 * 1024 * 1024)) * 100));

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/75 backdrop-blur-xl border-r border-white/10 flex flex-col p-6 gap-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <HardDrive className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">CDrive</span>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => { setSelectedFile(null); setShowUploadModal(true); }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-98"
          >
            <Plus className="w-5 h-5" />
            <span>Upload File</span>
          </button>
          <button 
            onClick={() => { setNewFolderName(''); setShowFolderModal(true); }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/70 border border-white/10 text-slate-200 font-semibold flex items-center justify-center gap-2 hover:bg-slate-700/70 transition-all"
          >
            <FolderPlus className="w-5 h-5" />
            <span>New Folder</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <button 
            onClick={() => { setActiveTab('my-drive'); loadItems(currentFolderId); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'my-drive' ? 'bg-slate-800/80 text-white border border-indigo-500/40 shadow-lg shadow-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <FolderOpen className="w-5 h-5 text-indigo-400" />
            <span>My Drive</span>
          </button>
          <button 
            onClick={() => { setActiveTab('recent'); loadItems('ALL'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'recent' ? 'bg-slate-800/80 text-white border border-indigo-500/40 shadow-lg shadow-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>Recent</span>
          </button>
          <button 
            onClick={() => { setActiveTab('favorites'); loadItems('ALL'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'favorites' ? 'bg-slate-800/80 text-white border border-indigo-500/40 shadow-lg shadow-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Star className="w-5 h-5 text-amber-400" />
            <span>Favorites</span>
          </button>
          <button 
            onClick={() => { setActiveTab('trash'); loadItems('ALL'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'trash' ? 'bg-slate-800/80 text-white border border-indigo-500/40 shadow-lg shadow-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Trash2 className="w-5 h-5 text-rose-400" />
            <span>Trash</span>
          </button>
        </nav>

        {/* Storage Bar */}
        <div className="glass-panel p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Cloud className="w-4 h-4 text-indigo-400" />
            <span>Storage Usage</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all" style={{ width: `${storagePct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{formatFileSize(totalUsedSize)} Used</span>
            <span>50 GB Total</span>
          </div>
        </div>
      </aside>

      {/* Main Section */}
      <main className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-6">
          <div className="flex-1 max-w-xl glass-panel px-4 py-2.5 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search files, folders, or document types..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-white w-full text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="glass-panel p-2.5 text-slate-300 hover:text-white transition-all">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="glass-panel px-3.5 py-1.5 rounded-full flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-bold text-white text-xs">
                {userId.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">{userId}</span>
                <span className="text-[10px] text-emerald-400 font-medium">JWT Authenticated</span>
              </div>
              <button onClick={() => setShowAuthModal(true)} className="text-slate-400 hover:text-white p-1">
                <Key className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Toolbar & Breadcrumbs */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2 text-lg font-bold text-slate-200">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                <span 
                  onClick={() => idx < breadcrumbs.length - 1 && navigateBreadcrumb(idx)}
                  className={`${idx === breadcrumbs.length - 1 ? 'text-white font-extrabold' : 'text-slate-400 hover:text-indigo-400 cursor-pointer'} transition-all`}
                >
                  {crumb.name}
                </span>
                {idx < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 text-slate-500" />}
              </React.Fragment>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="glass-panel p-1 flex gap-1">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => loadItems(currentFolderId)} className="glass-panel p-2.5 text-slate-400 hover:text-white transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Explorer Container */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files.length > 0) {
              setSelectedFile(e.dataTransfer.files[0]);
              setShowUploadModal(true);
            }
          }}
          className={`flex-1 overflow-y-auto relative rounded-2xl p-1 transition-all ${dragActive ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : ''}`}
        >
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 gap-3">
              <Loader className="w-6 h-6 spin text-indigo-400" />
              <span>Loading Drive contents...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
                <FolderOpen className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-slate-300">This Folder is Empty</h3>
              <p className="text-sm text-slate-500">Drag & drop files here or click "Upload File" to get started.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'flex flex-col gap-2'}>
              {filteredItems.map((item) => {
                const mime = (item.mimeType || '').toLowerCase();
                const ext = (item.name || '').split('.').pop()?.toLowerCase() || '';
                const thumbUrl = thumbnails[item.id];
                const isImage = mime.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext);
                const isPdf = mime.includes('pdf') || ext === 'pdf';

                return (
                  <div 
                    key={item.id}
                    onClick={() => item.type === 'FOLDER' ? openFolder(item) : openPreview(item)}
                    className="glass-panel p-3.5 flex flex-col gap-3 group hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all cursor-pointer relative"
                  >
                    {/* Visual Card Thumbnail Header */}
                    {item.type === 'FOLDER' ? (
                      <div className="flex items-center justify-between">
                        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                          <FolderOpen className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => handleToggleFavorite(item, e)}
                            className={`p-1.5 rounded-lg transition-all ${item.isFavorite ? 'text-amber-400 opacity-100' : 'text-slate-500 hover:text-amber-400 opacity-0 group-hover:opacity-100'}`}
                          >
                            <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                          </button>
                          {activeTab === 'trash' ? (
                            <button onClick={(e) => handleToggleTrash(item, false, e)} title="Restore" className="p-1.5 text-slate-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100"><RefreshCw className="w-4 h-4" /></button>
                          ) : (
                            <button onClick={(e) => handleToggleTrash(item, true, e)} title="Trash" className="p-1.5 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between z-10">
                          <div className="px-2 py-1 rounded-md bg-slate-900/80 border border-white/10 text-[10px] font-mono text-slate-300 uppercase">
                            {ext || 'FILE'}
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => handleToggleFavorite(item, e)}
                              className={`p-1.5 rounded-lg transition-all ${item.isFavorite ? 'text-amber-400 opacity-100' : 'text-slate-500 hover:text-amber-400 opacity-0 group-hover:opacity-100'}`}
                            >
                              <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                            </button>
                            {activeTab === 'trash' ? (
                              <button onClick={(e) => handleToggleTrash(item, false, e)} title="Restore" className="p-1.5 text-slate-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100"><RefreshCw className="w-4 h-4" /></button>
                            ) : (
                              <button onClick={(e) => handleToggleTrash(item, true, e)} title="Trash" className="p-1.5 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </div>
                        </div>

                        {/* Thumbnail Image / PDF Preview Header */}
                        <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-900/90 border border-white/5 flex items-center justify-center relative group-hover:border-indigo-500/30 transition-all">
                          {isImage && thumbUrl ? (
                            <img src={thumbUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : isPdf && thumbUrl ? (
                            <div className="w-full h-full relative overflow-hidden bg-slate-950 pointer-events-none flex items-center justify-center">
                              <object 
                                data={`${thumbUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0`} 
                                type="application/pdf" 
                                className="w-full h-[180px] pointer-events-none border-none opacity-90 scale-90 -mt-2"
                              >
                                <div className="flex flex-col items-center gap-1.5 p-2">
                                  <FileText className="w-8 h-8 text-rose-400" />
                                  <span className="text-[10px] font-mono text-rose-300">PDF DOCUMENT</span>
                                </div>
                              </object>
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent pointer-events-none" />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              {getFileIcon(item)}
                              <span className="text-[10px] font-mono text-slate-500 uppercase">{ext || 'FILE'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-slate-200 truncate" title={item.name}>{item.name}</span>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{item.type === 'FOLDER' ? 'Folder' : formatFileSize(item.size)}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" /> Authentication Settings
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">User ID</label>
                <input 
                  type="text" 
                  value={userId} 
                  onChange={(e) => setUserId(e.target.value)}
                  className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">API Base URL</label>
                <input 
                  type="text" 
                  value={apiBaseUrl} 
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">JWT Bearer Token</label>
                <textarea 
                  value={jwtToken} 
                  onChange={(e) => setJwtToken(e.target.value)}
                  rows={3}
                  className="bg-slate-800 border border-white/10 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-indigo-500" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button 
                onClick={async () => {
                  try {
                    const res = await api.fetchToken(userId);
                    setJwtToken(res.token);
                    showToast('Generated new JWT token', 'success');
                  } catch (err: any) {
                    showToast(`Token generation failed: ${err.message}`, 'error');
                  }
                }}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all"
              >
                Generate Token
              </button>
              <button 
                onClick={() => {
                  api.setConfig(apiBaseUrl, userId, jwtToken);
                  setShowAuthModal(false);
                  showToast('Auth settings saved', 'success');
                  loadItems(currentFolderId);
                }}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Creation Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-400" /> Create New Folder
              </h3>
              <button onClick={() => setShowFolderModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Folder Name</label>
              <input 
                type="text" 
                placeholder="e.g. Documents, Photographs, Projects"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" 
              />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button onClick={() => setShowFolderModal(false)} className="py-2 px-4 text-slate-400 hover:text-white text-sm font-semibold">Cancel</button>
              <button onClick={handleCreateFolder} className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all">Create Folder</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-400" /> Upload File
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-500/40 bg-slate-800/50 hover:bg-slate-800 rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center gap-3 transition-all"
            >
              <FileUp className="w-12 h-12 text-indigo-400" />
              <p className="font-semibold text-slate-200">Click or drag file here to upload</p>
              <p className="text-xs text-slate-400">PDF, Images, DOCX, Code, Audio, Video</p>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
            </div>

            {selectedFile && (
              <div className="flex flex-col gap-2 bg-slate-800/80 p-4 rounded-xl border border-white/10">
                <div className="flex justify-between text-sm font-semibold text-slate-200">
                  <span className="truncate">{selectedFile.name}</span>
                  <span className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</span>
                </div>
                {uploadProgress > 0 && (
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                {uploadStatus && <span className="text-xs text-indigo-400">{uploadStatus}</span>}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button onClick={() => setShowUploadModal(false)} className="py-2 px-4 text-slate-400 hover:text-white text-sm font-semibold">Cancel</button>
              <button 
                onClick={handleFileUpload}
                disabled={!selectedFile || isUploading}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center gap-2"
              >
                {isUploading && <Loader className="w-4 h-4 spin" />}
                <span>Start Upload</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {showPreviewModal && previewItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2 truncate">
                <File className="w-5 h-5 text-indigo-400" /> {previewItem.name}
              </h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px]">
              {!downloadUrl ? (
                <div className="flex items-center gap-3 text-slate-400 py-12">
                  <Loader className="w-6 h-6 spin text-indigo-400" />
                  <span>Loading live S3 cloud preview...</span>
                </div>
              ) : (() => {
                const mime = (previewItem.mimeType || '').toLowerCase();
                const ext = (previewItem.name || '').split('.').pop()?.toLowerCase() || '';

                // 1. PDF Document Preview
                if (mime.includes('pdf') || ext === 'pdf') {
                  return (
                    <iframe 
                      src={downloadUrl} 
                      title={previewItem.name} 
                      className="w-full h-[520px] rounded-xl border border-white/10 bg-slate-950" 
                    />
                  );
                }

                // 2. Image Preview
                if (mime.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
                  return (
                    <div className="flex items-center justify-center p-2 max-h-[520px]">
                      <img 
                        src={downloadUrl} 
                        alt={previewItem.name} 
                        className="max-h-[480px] max-w-full rounded-xl border border-white/10 object-contain shadow-2xl" 
                      />
                    </div>
                  );
                }

                // 3. Video Preview
                if (mime.includes('video') || ['mp4', 'webm', 'mov'].includes(ext)) {
                  return (
                    <video controls autoPlay src={downloadUrl} className="max-h-[480px] w-full rounded-xl border border-white/10 shadow-2xl">
                      Your browser does not support video playback.
                    </video>
                  );
                }

                // 4. Audio Preview
                if (mime.includes('audio') || ['mp3', 'wav', 'ogg'].includes(ext)) {
                  return (
                    <div className="w-full py-12 px-6 flex flex-col items-center gap-4 text-center">
                      <Music className="w-16 h-16 text-cyan-400" />
                      <h4 className="font-bold text-slate-200">{previewItem.name}</h4>
                      <audio controls src={downloadUrl} className="w-full max-w-md mt-4 rounded-xl" />
                    </div>
                  );
                }

                // 5. Generic Document Summary Card
                return (
                  <div className="py-8 px-6 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      {getFileIcon(previewItem)}
                    </div>
                    <h4 className="font-bold text-slate-200">{previewItem.name}</h4>
                    <p className="text-xs text-slate-400">{formatFileSize(previewItem.size)} • {previewItem.mimeType || 'Document'} • Created {new Date(previewItem.createdAt).toLocaleDateString()}</p>
                    <div className="w-full text-left bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-400 border border-white/10 space-y-1 mt-2">
                      <div><strong>Item ID:</strong> {previewItem.id}</div>
                      <div><strong>S3 Key:</strong> {previewItem.s3Key || 'N/A'}</div>
                      <div><strong>DynamoDB PK:</strong> USER#{previewItem.userId}</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button 
                onClick={() => handleCreateShareLink(previewItem.id)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all flex items-center gap-2"
              >
                <Cloud className="w-4 h-4 text-cyan-400" /> Share Link
              </button>
              <a 
                href={downloadUrl} 
                target="_blank" 
                rel="noreferrer"
                onClick={async (e) => {
                  if (downloadUrl) {
                    try {
                      const res = await fetch(downloadUrl);
                      if (!res.ok) throw new Error('S3 object not found');
                    } catch {
                      e.preventDefault();
                      showToast(`Local Dev Mode: File "${previewItem.name}" metadata stored in local DynamoDB. Live S3 download activates on AWS deployment.`, 'info');
                    }
                  }
                }}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download File
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-cyan-400" /> Public Expiring Share Link
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">Anyone with this link can view & download this file. Link expires in <strong>24 hours</strong>.</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Public Share URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={shareUrl}
                  className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white font-mono text-xs outline-none flex-1 truncate" 
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    showToast('Copied share link to clipboard!', 'success');
                  }}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-white/10">
              <button onClick={() => setShowShareModal(false)} className="py-2 px-4 rounded-xl bg-slate-800 text-white text-xs font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showDeleteModal && pendingDeleteItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Confirm Deletion
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-300">Are you sure you want to delete <strong className="text-white">"{pendingDeleteItem.name}"</strong>?</p>
            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button onClick={() => setShowDeleteModal(false)} className="py-2 px-4 text-slate-400 hover:text-white text-sm font-semibold">Cancel</button>
              <button onClick={handleConfirmDelete} className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-all">Delete Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts Container */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {toasts.map(toast => (
          <div key={toast.id} className={`glass-panel px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium border ${toast.type === 'success' ? 'border-emerald-500/50 text-emerald-300' : toast.type === 'error' ? 'border-rose-500/50 text-rose-300' : 'border-indigo-500/50 text-indigo-300'} shadow-xl`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <Info className="w-5 h-5 text-indigo-400" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
