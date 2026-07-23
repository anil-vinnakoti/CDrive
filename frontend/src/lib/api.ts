export interface DriveItem {
  pk: string;
  sk: string;
  id: string;
  userId: string;
  folderId?: string;
  type: 'FILE' | 'FOLDER';
  name: string;
  size?: number;
  mimeType?: string;
  s3Key?: string;
  thumbnailUrl?: string;
  isFavorite?: boolean;
  isTrashed?: boolean;
  trashedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListUserDriveResponse {
  userId: string;
  folderId?: string;
  count: number;
  files: DriveItem[];
  folders: DriveItem[];
  items: DriveItem[];
}

export interface UploadResponse {
  uploadUrl: string;
  expiresInSeconds: number;
  item: DriveItem;
}

export interface DownloadURLResponse {
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface ShareResponse {
  shareId: string;
  fileId: string;
  fileName: string;
  downloadUrl: string;
  expiresAt: string;
}

export interface TokenResponse {
  token: string;
  expiresInSeconds: number;
  userId: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  picture?: string;
  authProvider: string;
  token?: string;
}

export class CDriveClient {
  private baseUrl: string;
  private userId: string;
  private token: string;

  constructor() {
    const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3001/api/v1';
    this.baseUrl = typeof window !== 'undefined' ? localStorage.getItem('cdrive_api_url') || envUrl : envUrl;
    this.userId = typeof window !== 'undefined' ? localStorage.getItem('cdrive_user_id') || 'demo_user' : 'demo_user';
    this.token = typeof window !== 'undefined' ? localStorage.getItem('cdrive_jwt_token') || '' : '';
  }

  public getBaseUrl(): string { return this.baseUrl; }
  public getUserId(): string { return this.userId; }
  public getToken(): string { return this.token; }

  public setConfig(baseUrl: string, userId: string, token: string) {
    this.baseUrl = baseUrl;
    this.userId = userId;
    this.token = token;

    if (typeof window !== 'undefined') {
      localStorage.setItem('cdrive_api_url', baseUrl);
      localStorage.setItem('cdrive_user_id', userId);
      localStorage.setItem('cdrive_jwt_token', token);
    }
  }

  public async signUp(email: string, password: string, name?: string): Promise<UserResponse> {
    const res = await this.request<UserResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (res.token) {
      this.setConfig(this.baseUrl, res.id, res.token);
    }
    return res;
  }

  public async login(email: string, password: string): Promise<UserResponse> {
    const res = await this.request<UserResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      this.setConfig(this.baseUrl, res.id, res.token);
    }
    return res;
  }

  public async loginWithGoogle(idToken: string): Promise<UserResponse> {
    const res = await this.request<UserResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    if (res.token) {
      this.setConfig(this.baseUrl, res.id, res.token);
    }
    return res;
  }

  public async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/me');
  }

  public logout() {
    this.token = '';
    this.userId = '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cdrive_jwt_token');
      localStorage.removeItem('cdrive_user_id');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.details || `HTTP error ${response.status}`);
    }

    return data as T;
  }

  public async fetchToken(userId?: string): Promise<TokenResponse> {
    const uid = userId || this.userId;
    const data = await this.request<TokenResponse>('/auth/token', {
      method: 'POST',
      body: JSON.stringify({ userId: uid })
    });

    this.token = data.token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cdrive_jwt_token', data.token);
    }
    return data;
  }

  public async getItems(folderId: string = 'ROOT'): Promise<ListUserDriveResponse> {
    let endpoint = `/files?userId=${encodeURIComponent(this.userId)}`;
    if (folderId && folderId !== 'ALL') {
      endpoint += `&folderId=${encodeURIComponent(folderId)}`;
    }
    return this.request<ListUserDriveResponse>(endpoint);
  }

  public async createFolder(name: string, parentFolderId: string = 'ROOT'): Promise<DriveItem> {
    return this.request<DriveItem>('/folders', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.userId,
        name: name,
        folderId: parentFolderId
      })
    });
  }

  public async requestUploadUrl(file: File, folderId: string = 'ROOT'): Promise<UploadResponse> {
    return this.request<UploadResponse>('/files/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.userId,
        fileName: file.name,
        folderId: folderId,
        size: file.size,
        mimeType: file.type || 'application/octet-stream'
      })
    });
  }

  public async uploadToS3(uploadUrl: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('S3 network error during upload'));
      xhr.send(file);
    });
  }

  public async getDownloadUrl(fileId: string): Promise<DownloadURLResponse> {
    return this.request<DownloadURLResponse>(`/files/download-url?userId=${encodeURIComponent(this.userId)}&fileId=${encodeURIComponent(fileId)}`);
  }

  public async toggleFavorite(itemId: string, type: 'FILE' | 'FOLDER', isFavorite: boolean): Promise<{ message: string; isFavorite: boolean }> {
    return this.request<{ message: string; isFavorite: boolean }>('/items/favorite', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.userId,
        itemId: itemId,
        type: type,
        isFavorite: isFavorite
      })
    });
  }

  public async toggleTrash(itemId: string, type: 'FILE' | 'FOLDER', isTrashed: boolean): Promise<{ message: string; isTrashed: boolean }> {
    return this.request<{ message: string; isTrashed: boolean }>('/items/trash', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.userId,
        itemId: itemId,
        type: type,
        isTrashed: isTrashed
      })
    });
  }

  public async createShareLink(fileId: string, expiresInSeconds: number = 86400): Promise<ShareResponse> {
    return this.request<ShareResponse>('/files/share', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.userId,
        fileId: fileId,
        expiresInSeconds: expiresInSeconds
      })
    });
  }

  public async deleteItem(itemId: string, type: 'FILE' | 'FOLDER'): Promise<{ message: string; itemId: string }> {
    return this.request<{ message: string; itemId: string }>('/delete', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.userId,
        itemId: itemId,
        type: type
      })
    });
  }

  public async renameItem(itemId: string, type: 'FILE' | 'FOLDER', newName: string): Promise<{ message: string; name: string }> {
    return this.request<{ message: string; name: string }>('/items/rename', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.userId,
        itemId: itemId,
        type: type,
        newName: newName
      })
    });
  }
}

export const api = new CDriveClient();
