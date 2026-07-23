'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  HardDrive, Plus, FolderPlus, Clock, Star, Trash2, Cloud, Search, X,
  Moon, Sun, Key, LayoutGrid, List, RefreshCw, FolderOpen, ChevronRight,
  Loader, CheckCircle2, AlertCircle, Info, LogOut
} from 'lucide-react';

import { api, DriveItem, UserResponse } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { DriveItemCard } from '@/components/DriveItemCard';

// Code Splitting with dynamic imports for modals (loaded lazily on demand)
const FolderModal = dynamic(() => import('@/components/modals/FolderModal').then(m => m.FolderModal), { ssr: false });
const UploadModal = dynamic(() => import('@/components/modals/UploadModal').then(m => m.UploadModal), { ssr: false });
const PreviewModal = dynamic(() => import('@/components/modals/PreviewModal').then(m => m.PreviewModal), { ssr: false });
const ShareModal = dynamic(() => import('@/components/modals/ShareModal').then(m => m.ShareModal), { ssr: false });
const ConfirmDeleteModal = dynamic(() => import('@/components/modals/ConfirmDeleteModal').then(m => m.ConfirmDeleteModal), { ssr: false });
const EmptyTrashModal = dynamic(() => import('@/components/modals/ConfirmDeleteModal').then(m => m.EmptyTrashModal), { ssr: false });

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
  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modals & Forms State
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState<boolean>(false);

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

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

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
  }, [showToast]);

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

  // Helper to apply theme to DOM element
  const applyThemeToDOM = (t: 'dark' | 'light') => {
    document.documentElement.setAttribute('data-theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Load saved theme on mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('cdrive_theme') : null;
    const initial = (saved === 'light' || saved === 'dark') ? saved : 'dark';
    setTheme(initial);
    applyThemeToDOM(initial);
  }, []);

  // Handle Theme Toggle
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cdrive_theme', next);
    }
    applyThemeToDOM(next);
  };

  // Folder Open & Breadcrumbs
  const openFolder = useCallback((folder: DriveItem) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
    loadItems(folder.id);
  }, [loadItems]);

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
  const openPreview = useCallback(async (item: DriveItem) => {
    setPreviewItem(item);
    setShowPreviewModal(true);
    setDownloadUrl('');

    try {
      const res = await api.getDownloadUrl(item.id);
      setDownloadUrl(res.downloadUrl);
    } catch (err: any) {
      showToast(`Failed to load file preview: ${err.message}`, 'error');
    }
  }, [showToast]);

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
  const handleToggleFavorite = useCallback(async (item: DriveItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nextFav = !item.isFavorite;
      await api.toggleFavorite(item.id, item.type, nextFav);
      showToast(nextFav ? 'Added to favorites' : 'Removed from favorites', 'success');
      loadItems(currentFolderId);
    } catch (err: any) {
      showToast(`Favorite update failed: ${err.message}`, 'error');
    }
  }, [currentFolderId, loadItems, showToast]);

  // Toggle Trash Status
  const handleToggleTrash = useCallback(async (item: DriveItem, isTrashAction: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleTrash(item.id, item.type, isTrashAction);
      showToast(isTrashAction ? 'Moved to trash' : 'Restored from trash', 'success');
      loadItems(currentFolderId);
    } catch (err: any) {
      showToast(`Trash update failed: ${err.message}`, 'error');
    }
  }, [currentFolderId, loadItems, showToast]);

  const handlePermanentDeleteClick = useCallback((item: DriveItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteItem(item);
    setShowDeleteModal(true);
  }, []);

  // Permanent Delete Confirm
  const handleConfirmDelete = async () => {
    if (!pendingDeleteItem) return;
    try {
      await api.deleteItem(pendingDeleteItem.id, pendingDeleteItem.type);
      setShowDeleteModal(false);
      setPendingDeleteItem(null);
      showToast(`Permanently deleted "${pendingDeleteItem.name}"`, 'success');
      loadItems(currentFolderId);
    } catch (err: any) {
      showToast(`Deletion failed: ${err.message}`, 'error');
    }
  };

  // Empty Trash Action
  const handleEmptyTrash = async () => {
    try {
      const trashedItems = items.filter(i => i.isTrashed);
      for (const item of trashedItems) {
        await api.deleteItem(item.id, item.type);
      }
      setShowEmptyTrashModal(false);
      showToast(`Permanently deleted ${trashedItems.length} item(s) from Trash`, 'success');
      loadItems('ALL');
    } catch (err: any) {
      showToast(`Empty trash failed: ${err.message}`, 'error');
    }
  };

  // Format Helpers
  const formatFileSize = useCallback((bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // Filter Items by Search Query and Active Tab (Memoized)
  const filteredItems = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(query);
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
  }, [items, debouncedSearchQuery, activeTab]);

  const totalUsedSize = useMemo(() => {
    return items.filter(i => i.type === 'FILE').reduce((acc, i) => acc + (i.size || 0), 0);
  }, [items]);

  const storagePct = useMemo(() => {
    return Math.min(100, Math.max(5, (totalUsedSize / (50 * 1024 * 1024 * 1024)) * 100));
  }, [totalUsedSize]);

  if (authChecking) {
    return (
      <div className="min-h-screen w-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-3 text-zinc-600 dark:text-zinc-400">
        <Loader className="w-7 h-7 text-zinc-800 dark:text-zinc-100 animate-spin" />
        <p className="text-xs font-medium tracking-wide">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Minimalist Monochromatic Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col p-6 gap-6 z-10 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-950 flex items-center justify-center shadow-sm">
            <HardDrive className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight">CDrive</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => { setSelectedFile(null); setShowUploadModal(true); }}
            title="Upload a new file directly to S3 cloud storage"
            className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-950 font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload File</span>
          </button>
          <button
            onClick={() => { setNewFolderName(''); setShowFolderModal(true); }}
            title="Create a new folder"
            className="w-full py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span>New Folder</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <button
            onClick={() => { setActiveTab('my-drive'); loadItems(currentFolderId); }}
            title="View all my files and folders"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTab === 'my-drive' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60'}`}
          >
            <FolderOpen className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>My Drive</span>
          </button>
          <button
            onClick={() => { setActiveTab('recent'); loadItems('ALL'); }}
            title="View recent files"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTab === 'recent' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60'}`}
          >
            <Clock className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>Recent</span>
          </button>
          <button
            onClick={() => { setActiveTab('favorites'); loadItems('ALL'); }}
            title="View starred favorite items"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTab === 'favorites' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60'}`}
          >
            <Star className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>Favorites</span>
          </button>
          <button
            onClick={() => { setActiveTab('trash'); loadItems('ALL'); }}
            title="View items in trash"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTab === 'trash' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60'}`}
          >
            <Trash2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>Trash</span>
          </button>
        </nav>

        {/* Minimalist Storage Bar */}
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-800 dark:text-zinc-300">
            <span className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Storage
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Intelligent</span>
          </div>
          <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-zinc-800 dark:bg-zinc-100 rounded-full transition-all" style={{ width: `${storagePct}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
            <span>{formatFileSize(totalUsedSize)}</span>
            <span>50 GB</span>
          </div>
        </div>
      </aside>

      {/* Main Section */}
      <main className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-6">
          <div className="flex-1 max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 flex items-center gap-3 focus-within:border-zinc-400 dark:focus-within:border-zinc-700 transition-colors">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search files, folders, or formats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 w-full text-xs placeholder-zinc-400 dark:placeholder-zinc-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} title="Clear search query" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-full flex items-center gap-3">
              {currentUser?.picture ? (
                <img src={currentUser.picture} alt={currentUser.name} className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-medium text-zinc-800 dark:text-zinc-100 text-xs">
                  {(currentUser?.name || userId || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{currentUser?.name || userId}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">{currentUser?.email || 'Authenticated'}</span>
              </div>
              <button
                onClick={() => {
                  api.logout();
                  router.push('/login');
                }}
                title="Log Out of your CDrive account"
                className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 p-1 rounded-lg transition-colors ml-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Toolbar & Breadcrumbs */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                <span
                  onClick={() => idx < breadcrumbs.length - 1 && navigateBreadcrumb(idx)}
                  title={idx < breadcrumbs.length - 1 ? `Navigate to ${crumb.name}` : `Current folder: ${crumb.name}`}
                  className={`${idx === breadcrumbs.length - 1 ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer'} transition-colors`}
                >
                  {crumb.name}
                </span>
                {idx < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />}
              </React.Fragment>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {activeTab === 'trash' && filteredItems.length > 0 && (
              <button
                onClick={() => setShowEmptyTrashModal(true)}
                title="Permanently delete all items currently in Trash"
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer mr-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Trash</span>
              </button>
            )}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-lg flex gap-1">
              <button onClick={() => setViewMode('grid')} title="Switch to Grid View" className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} title="Switch to List View" className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => loadItems(currentFolderId)} title="Refresh Drive contents" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg transition-colors cursor-pointer">
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
          className={`flex-1 overflow-y-auto relative rounded-xl p-1 transition-all ${dragActive ? 'border-2 border-dashed border-zinc-400 bg-zinc-200/50 dark:bg-zinc-900/50' : ''}`}
        >
          {loading ? (
            <div className="flex items-center justify-center h-64 text-zinc-500 dark:text-zinc-400 gap-3">
              <Loader className="w-5 h-5 spin text-zinc-800 dark:text-zinc-200" />
              <span className="text-xs font-medium">Loading Drive contents...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h3 className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">No items in this folder</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Drag & drop files here or click "Upload File" to get started.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'flex flex-col gap-2'}>
              {filteredItems.map((item) => (
                <DriveItemCard
                  key={item.id}
                  item={item}
                  activeTab={activeTab}
                  thumbUrl={thumbnails[item.id]}
                  onOpenFolder={openFolder}
                  onOpenPreview={openPreview}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleTrash={handleToggleTrash}
                  onPermanentDelete={handlePermanentDeleteClick}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Code-Split Modals Loaded Dynamically on Demand */}
      <FolderModal
        show={showFolderModal}
        newFolderName={newFolderName}
        onChangeName={setNewFolderName}
        onClose={() => setShowFolderModal(false)}
        onCreate={handleCreateFolder}
      />

      <UploadModal
        show={showUploadModal}
        selectedFile={selectedFile}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadStatus={uploadStatus}
        onSelectFile={setSelectedFile}
        onStartUpload={handleFileUpload}
        onClose={() => setShowUploadModal(false)}
        formatFileSize={formatFileSize}
      />

      <PreviewModal
        show={showPreviewModal}
        previewItem={previewItem}
        downloadUrl={downloadUrl}
        onClose={() => setShowPreviewModal(false)}
        onCreateShareLink={handleCreateShareLink}
        onDownloadClick={handleDownloadClick}
        formatFileSize={formatFileSize}
      />

      <ShareModal
        show={showShareModal}
        shareUrl={shareUrl}
        onClose={() => setShowShareModal(false)}
        onCopy={() => {
          navigator.clipboard.writeText(shareUrl);
          showToast('Copied share link to clipboard!', 'success');
        }}
      />

      <ConfirmDeleteModal
        show={showDeleteModal}
        item={pendingDeleteItem}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />

      <EmptyTrashModal
        show={showEmptyTrashModal}
        onClose={() => setShowEmptyTrashModal(false)}
        onConfirm={handleEmptyTrash}
      />

      {/* Minimalist Toasts Container */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-50">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-medium text-zinc-800 dark:text-zinc-200 shadow-xl">
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" /> : toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> : <Info className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
