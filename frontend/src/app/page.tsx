'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  HardDrive, Plus, FolderPlus, Clock, Star, Trash2, Cloud, Search, X,
  Moon, Sun, Key, LayoutGrid, List, RefreshCw, FolderOpen, UploadCloud,
  FileText, Image as ImageIcon, Music, Video, Code2, File, ChevronRight,
  Download, FileUp, Loader, CheckCircle2, AlertCircle, Info, AlertTriangle, FileType2, LogOut
} from 'lucide-react';

import { api, DriveItem, UserResponse } from '@/lib/api';

export default function DrivePage() {
  const router = useRouter();

  // Application State
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState<'my-drive' | 'recent' | 'favorites' | 'trash'>('my-drive');
  const [currentFolderId, setCurrentFolderId] = useState<string>('ROOT');
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([
    { id: 'ROOT', name: 'My Drive' }
  ]);

  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modals & Forms State
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const [newFolderName, setNewFolderName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [pendingDeleteItem, setPendingDeleteItem] = useState<DriveItem | null>(null);

  // Settings State
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [jwtToken, setJwtToken] = useState<string>('');

  // Thumbnails Cache
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Toast Notifications
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'info' | 'success' | 'error' }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Sync API Client Configuration
  useEffect(() => {
    setApiBaseUrl(api.getBaseUrl());
    setUserId(api.getUserId());
    setJwtToken(api.getToken());
  }, []);

  // Fetch Items for Current View
  const loadItems = useCallback(async (folderId: string = 'ROOT') => {
    setLoading(true);
    try {
      const res = await api.getItems(folderId);
      setItems(res.items || []);
    } catch (err: any) {
      showToast(`Error fetching drive items: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Pre-load Thumbnail Previews for Images & PDFs
  useEffect(() => {
    const loadThumbnails = async () => {
      const nextThumbs: Record<string, string> = { ...thumbnails };
      let changed = false;

      for (const item of items) {
        if (item.type === 'FILE' && !nextThumbs[item.id]) {
          const mime = (item.mimeType || '').toLowerCase();
          const ext = (item.name || '').split('.').pop()?.toLowerCase() || '';

          if (mime.includes('image') || mime.includes('pdf') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf'].includes(ext)) {
            try {
              const res = await api.getDownloadUrl(item.id);
              if (res.downloadUrl) {
                nextThumbs[item.id] = res.downloadUrl;
                changed = true;
              }
            } catch {
              // Ignore thumbnail loading errors
            }
          }
        }
      }

      if (changed) {
        setThumbnails(nextThumbs);
      }
    };

    if (items.length > 0) {
      loadThumbnails();
    }
  }, [items, thumbnails]);

  // Auth Verification & Redirect Check
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const token = api.getToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const u = await api.getCurrentUser();
        setCurrentUser(u);
        setAuthChecking(false);
        loadItems('ROOT');
      } catch {
        api.logout();
        router.replace('/login');
      }
    };

    checkAuthAndLoad();
  }, [router, loadItems]);

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
    setUploadProgress(10);
    setUploadStatus('Requesting S3 presigned upload URL...');

    try {
      const res = await api.requestUploadUrl(selectedFile, currentFolderId);
      setUploadStatus('Uploading binary object directly to S3...');

      await api.uploadToS3(res.uploadUrl, selectedFile, (pct) => {
        setUploadProgress(pct);
      });

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
      showToast(`Failed to load file preview: ${err.message}`, 'error');
    }
  };

  // Download Trigger
  const handleDownloadClick = () => {
    if (!downloadUrl) return;
    showToast(`Downloading file...`, 'info');
  };

  // Create Public Share Link
  const handleCreateShareLink = async (fileId: string) => {
    try {
      const res = await api.createShareLink(fileId, 86400);
      setShareUrl(res.downloadUrl);
      setShowShareModal(true);
      showToast('Public share link generated!', 'success');
    } catch (err: any) {
      showToast(`Share link creation failed: ${err.message}`, 'error');
    }
  };

  // Toggle Favorite Status
  const handleToggleFavorite = async (item: DriveItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nextFav = !item.isFavorite;
      await api.toggleFavorite(item.id, item.type, nextFav);
      showToast(nextFav ? 'Added to favorites' : 'Removed from favorites', 'success');
      loadItems(currentFolderId);
    } catch (err: any) {
      showToast(`Favorite update failed: ${err.message}`, 'error');
    }
  };

  // Toggle Trash Status
  const handleToggleTrash = async (item: DriveItem, isTrashAction: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleTrash(item.id, item.type, isTrashAction);
      showToast(isTrashAction ? 'Moved to trash' : 'Restored from trash', 'success');
      loadItems(currentFolderId);
    } catch (err: any) {
      showToast(`Trash update failed: ${err.message}`, 'error');
    }
  };

  // Permanent Delete Confirm
  const handleConfirmDelete = async () => {
    if (!pendingDeleteItem) return;
    try {
      await api.deleteItem(pendingDeleteItem.id, pendingDeleteItem.type);
      setShowDeleteModal(false);
      setPendingDeleteItem(null);
      showToast(`Deleted "${pendingDeleteItem.name}"`, 'success');
      loadItems(currentFolderId);
    } catch (err: any) {
      showToast(`Deletion failed: ${err.message}`, 'error');
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
    if (item.type === 'FOLDER') return <FolderOpen className="w-6 h-6 text-zinc-100" />;
    const mime = (item.mimeType || '').toLowerCase();
    const ext = (item.name || '').split('.').pop()?.toLowerCase();

    if (mime.includes('pdf') || ext === 'pdf') return <FileText className="w-6 h-6 text-zinc-300" />;
    if (mime.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) return <ImageIcon className="w-6 h-6 text-zinc-300" />;
    if (mime.includes('word') || ['doc', 'docx', 'txt'].includes(ext || '')) return <FileType2 className="w-6 h-6 text-zinc-300" />;
    if (mime.includes('code') || ['js', 'ts', 'go', 'py', 'json', 'html', 'css'].includes(ext || '')) return <Code2 className="w-6 h-6 text-zinc-300" />;
    if (mime.includes('audio') || ['mp3', 'wav'].includes(ext || '')) return <Music className="w-6 h-6 text-zinc-300" />;
    if (mime.includes('video') || ['mp4', 'webm'].includes(ext || '')) return <Video className="w-6 h-6 text-zinc-300" />;

    return <File className="w-6 h-6 text-zinc-400" />;
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

    if (item.isTrashed) return false;
    return true;
  });

  const totalUsedSize = items.filter(i => i.type === 'FILE').reduce((acc, i) => acc + (i.size || 0), 0);
  const storagePct = Math.min(100, Math.max(5, (totalUsedSize / (50 * 1024 * 1024 * 1024)) * 100));

  if (authChecking) {
    return (
      <div className="min-h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader className="w-7 h-7 text-zinc-100 animate-spin" />
        <p className="text-xs font-medium tracking-wide text-zinc-400">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Minimalist Monochromatic Sidebar */}
      <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col p-6 gap-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-md">
            <HardDrive className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg text-zinc-100 tracking-tight">CDrive</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => { setSelectedFile(null); setShowUploadModal(true); }}
            className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Upload File</span>
          </button>
          <button
            onClick={() => { setNewFolderName(''); setShowFolderModal(true); }}
            className="w-full py-2 px-4 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-800/80 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-zinc-400" />
            <span>New Folder</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <button
            onClick={() => { setActiveTab('my-drive'); loadItems(currentFolderId); }}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'my-drive' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'}`}
          >
            <FolderOpen className="w-4 h-4 text-zinc-300" />
            <span>My Drive</span>
          </button>
          <button
            onClick={() => { setActiveTab('recent'); loadItems('ALL'); }}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'recent' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'}`}
          >
            <Clock className="w-4 h-4 text-zinc-300" />
            <span>Recent</span>
          </button>
          <button
            onClick={() => { setActiveTab('favorites'); loadItems('ALL'); }}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'favorites' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'}`}
          >
            <Star className="w-4 h-4 text-zinc-300" />
            <span>Favorites</span>
          </button>
          <button
            onClick={() => { setActiveTab('trash'); loadItems('ALL'); }}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'trash' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'}`}
          >
            <Trash2 className="w-4 h-4 text-zinc-300" />
            <span>Trash</span>
          </button>
        </nav>

        {/* Minimalist Storage Bar */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
            <span className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-zinc-400" /> Storage
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Intelligent</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-zinc-100 rounded-full transition-all" style={{ width: `${storagePct}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
            <span>{formatFileSize(totalUsedSize)}</span>
            <span>50 GB</span>
          </div>
        </div>
      </aside>

      {/* Main Section */}
      <main className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-6">
          <div className="flex-1 max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 flex items-center gap-3 focus-within:border-zinc-700 transition-colors">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search files, folders, or formats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-zinc-100 w-full text-xs placeholder-zinc-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="bg-zinc-900 border border-zinc-800 p-2.5 text-zinc-400 hover:text-zinc-100 rounded-xl transition-colors">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full flex items-center gap-3">
              {currentUser?.picture ? (
                <img src={currentUser.picture} alt={currentUser.name} className="w-7 h-7 rounded-full border border-zinc-700 object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-medium text-zinc-100 text-xs">
                  {(currentUser?.name || userId || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-medium text-zinc-200">{currentUser?.name || userId}</span>
                <span className="text-[10px] text-zinc-400 truncate max-w-[120px]">{currentUser?.email || 'Authenticated'}</span>
              </div>
              <button
                onClick={() => {
                  api.logout();
                  router.push('/login');
                }}
                title="Log Out"
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Toolbar & Breadcrumbs */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                <span
                  onClick={() => idx < breadcrumbs.length - 1 && navigateBreadcrumb(idx)}
                  className={`${idx === breadcrumbs.length - 1 ? 'text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-200 cursor-pointer'} transition-colors`}
                >
                  {crumb.name}
                </span>
                {idx < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 text-zinc-600" />}
              </React.Fragment>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-lg flex gap-1">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => loadItems(currentFolderId)} className="bg-zinc-900 border border-zinc-800 p-2.5 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors">
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
          className={`flex-1 overflow-y-auto relative rounded-xl p-1 transition-all ${dragActive ? 'border-2 border-dashed border-zinc-400 bg-zinc-900/50' : ''}`}
        >
          {loading ? (
            <div className="flex items-center justify-center h-64 text-zinc-400 gap-3">
              <Loader className="w-5 h-5 spin text-zinc-200" />
              <span className="text-xs font-medium">Loading Drive contents...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h3 className="font-medium text-zinc-200 text-sm">No items in this folder</h3>
              <p className="text-xs text-zinc-500">Drag & drop files here or click "Upload File" to get started.</p>
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
                    className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3 group hover:border-zinc-700 transition-colors cursor-pointer relative"
                  >
                    {/* Visual Card Header */}
                    {item.type === 'FOLDER' ? (
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-zinc-100" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleToggleFavorite(item, e)}
                            className={`p-1.5 rounded-lg transition-colors ${item.isFavorite ? 'text-zinc-100 opacity-100' : 'text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100'}`}
                          >
                            <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-zinc-100' : ''}`} />
                          </button>
                          {activeTab === 'trash' ? (
                            <button onClick={(e) => handleToggleTrash(item, false, e)} title="Restore" className="p-1.5 text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100"><RefreshCw className="w-4 h-4" /></button>
                          ) : (
                            <button onClick={(e) => handleToggleTrash(item, true, e)} title="Trash" className="p-1.5 text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between z-10">
                          <div className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300 uppercase">
                            {ext || 'FILE'}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleToggleFavorite(item, e)}
                              className={`p-1.5 rounded-lg transition-colors ${item.isFavorite ? 'text-zinc-100 opacity-100' : 'text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100'}`}
                            >
                              <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-zinc-100' : ''}`} />
                            </button>
                            {activeTab === 'trash' ? (
                              <button onClick={(e) => handleToggleTrash(item, false, e)} title="Restore" className="p-1.5 text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100"><RefreshCw className="w-4 h-4" /></button>
                            ) : (
                              <button onClick={(e) => handleToggleTrash(item, true, e)} title="Trash" className="p-1.5 text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </div>
                        </div>

                        {/* Thumbnail Image / PDF Preview Header */}
                        <div className="h-32 w-full rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800/80 flex items-center justify-center relative group-hover:border-zinc-700 transition-colors">
                          {isImage && thumbUrl ? (
                            <img src={thumbUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : isPdf && thumbUrl ? (
                            <div className="w-full h-full relative overflow-hidden bg-zinc-950 pointer-events-none flex items-center justify-center">
                              <object
                                data={`${thumbUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0`}
                                type="application/pdf"
                                className="w-full h-[180px] pointer-events-none border-none opacity-85 scale-90 -mt-2"
                              >
                                <div className="flex flex-col items-center gap-1.5 p-2">
                                  <FileText className="w-7 h-7 text-zinc-300" />
                                  <span className="text-[10px] font-mono text-zinc-400">PDF</span>
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
                      <span className="font-medium text-xs text-zinc-200 truncate" title={item.name}>{item.name}</span>
                      <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
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
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-6 rounded-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-medium text-sm text-zinc-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-zinc-400" /> Authentication Settings
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">User ID</label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none focus:border-zinc-700"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">API Base URL</label>
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none focus:border-zinc-700"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">JWT Bearer Token</label>
                <textarea
                  value={jwtToken}
                  onChange={(e) => setJwtToken(e.target.value)}
                  rows={3}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 font-mono text-xs outline-none focus:border-zinc-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
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
                className="py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors"
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
                className="py-2 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Creation Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-6 rounded-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-medium text-sm text-zinc-100 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-zinc-400" /> Create New Folder
              </h3>
              <button onClick={() => setShowFolderModal(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Folder Name</label>
              <input
                type="text"
                placeholder="e.g. Documents, Photographs, Projects"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none focus:border-zinc-700"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
              <button onClick={() => setShowFolderModal(false)} className="py-2 px-4 text-zinc-400 hover:text-zinc-200 text-xs font-medium">Cancel</button>
              <button onClick={handleCreateFolder} className="py-2 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition-colors">Create Folder</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-6 rounded-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-medium text-sm text-zinc-100 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-zinc-400" /> Upload File
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-zinc-700 bg-zinc-950 hover:bg-zinc-900 rounded-xl p-8 text-center cursor-pointer flex flex-col items-center gap-3 transition-colors"
            >
              <FileUp className="w-10 h-10 text-zinc-400" />
              <p className="font-medium text-xs text-zinc-200">Click or drag file here to upload</p>
              <p className="text-[11px] text-zinc-500">PDF, Images, DOCX, Code, Audio, Video</p>
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
              <div className="flex flex-col gap-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div className="flex justify-between text-xs font-medium text-zinc-200">
                  <span className="truncate">{selectedFile.name}</span>
                  <span className="text-zinc-400 font-mono">{formatFileSize(selectedFile.size)}</span>
                </div>
                {uploadProgress > 0 && (
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-100 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                {uploadStatus && <span className="text-[11px] text-zinc-400 font-mono">{uploadStatus}</span>}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
              <button onClick={() => setShowUploadModal(false)} className="py-2 px-4 text-zinc-400 hover:text-zinc-200 text-xs font-medium">Cancel</button>
              <button
                onClick={handleFileUpload}
                disabled={!selectedFile || isUploading}
                className="py-2 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium text-xs transition-colors flex items-center gap-2"
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
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl p-6 rounded-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-medium text-sm text-zinc-100 flex items-center gap-2 truncate">
                <File className="w-4 h-4 text-zinc-400" /> {previewItem.name}
              </h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px]">
              {!downloadUrl ? (
                <div className="flex items-center gap-3 text-zinc-400 py-12">
                  <Loader className="w-5 h-5 spin text-zinc-200" />
                  <span className="text-xs">Loading live preview...</span>
                </div>
              ) : (() => {
                const mime = (previewItem.mimeType || '').toLowerCase();
                const ext = (previewItem.name || '').split('.').pop()?.toLowerCase() || '';

                if (mime.includes('pdf') || ext === 'pdf') {
                  return (
                    <iframe
                      src={downloadUrl}
                      title={previewItem.name}
                      className="w-full h-[500px] rounded-lg border border-zinc-800 bg-zinc-950"
                    />
                  );
                }

                if (mime.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
                  return (
                    <div className="flex items-center justify-center p-2 max-h-[500px]">
                      <img
                        src={downloadUrl}
                        alt={previewItem.name}
                        className="max-h-[460px] max-w-full rounded-lg border border-zinc-800 object-contain"
                      />
                    </div>
                  );
                }

                if (mime.includes('video') || ['mp4', 'webm', 'mov'].includes(ext)) {
                  return (
                    <video controls autoPlay src={downloadUrl} className="max-h-[460px] w-full rounded-lg border border-zinc-800">
                      Your browser does not support video playback.
                    </video>
                  );
                }

                if (mime.includes('audio') || ['mp3', 'wav', 'ogg'].includes(ext)) {
                  return (
                    <div className="w-full py-12 px-6 flex flex-col items-center gap-4 text-center">
                      <Music className="w-12 h-12 text-zinc-300" />
                      <h4 className="font-medium text-sm text-zinc-200">{previewItem.name}</h4>
                      <audio controls src={downloadUrl} className="w-full max-w-md mt-4 rounded-lg" />
                    </div>
                  );
                }

                return (
                  <div className="py-8 px-6 text-center flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
                      {getFileIcon(previewItem)}
                    </div>
                    <h4 className="font-medium text-sm text-zinc-200">{previewItem.name}</h4>
                    <p className="text-xs text-zinc-400">{formatFileSize(previewItem.size)} • {previewItem.mimeType || 'Document'} • Created {new Date(previewItem.createdAt).toLocaleDateString()}</p>
                    <div className="w-full text-left bg-zinc-900 p-4 rounded-lg font-mono text-xs text-zinc-400 border border-zinc-800 space-y-1 mt-2">
                      <div><strong>Item ID:</strong> {previewItem.id}</div>
                      <div><strong>S3 Key:</strong> {previewItem.s3Key || 'N/A'}</div>
                      <div><strong>Storage Class:</strong> INTELLIGENT_TIERING</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
              <button
                onClick={() => handleCreateShareLink(previewItem.id)}
                className="py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors flex items-center gap-2"
              >
                <Cloud className="w-4 h-4 text-zinc-400" /> Share Link
              </button>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                onClick={handleDownloadClick}
                className="py-2 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download File
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-6 rounded-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-medium text-sm text-zinc-100 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-zinc-400" /> Expiring Share Link
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">Anyone with this link can view & download this file. Link expires in <strong>24 hours</strong>.</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Public Share URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs outline-none flex-1 truncate"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    showToast('Copied share link to clipboard!', 'success');
                  }}
                  className="py-2 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button onClick={() => setShowShareModal(false)} className="py-2 px-4 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showDeleteModal && pendingDeleteItem && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-6 rounded-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-medium text-sm text-zinc-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-zinc-400" /> Confirm Deletion
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-300">Are you sure you want to delete <strong className="text-zinc-100">"{pendingDeleteItem.name}"</strong>?</p>
            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
              <button onClick={() => setShowDeleteModal(false)} className="py-2 px-4 text-zinc-400 hover:text-zinc-200 text-xs font-medium">Cancel</button>
              <button onClick={handleConfirmDelete} className="py-2 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition-colors">Delete Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Minimalist Toasts Container */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-50">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-medium text-zinc-200 shadow-xl">
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-zinc-300" /> : toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-zinc-400" /> : <Info className="w-4 h-4 text-zinc-400" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
