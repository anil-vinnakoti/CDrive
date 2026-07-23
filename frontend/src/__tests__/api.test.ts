import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../lib/api';

describe('API Client Utility', () => {
  beforeEach(() => {
    localStorage.clear();
    api.setConfig('https://api.test.com', 'test-user', 'test-jwt-token');
  });

  it('should retrieve stored configuration values correctly', () => {
    expect(api.getUserId()).toBe('test-user');
    expect(api.getToken()).toBe('test-jwt-token');
    expect(api.getBaseUrl()).toBe('https://api.test.com');
  });

  it('should clear authentication token and user configuration on logout', () => {
    api.logout();
    expect(api.getToken()).toBe('');
    expect(api.getUserId()).toBe('');
    expect(localStorage.getItem('cdrive_jwt_token')).toBeNull();
  });

  it('should format upload request body correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ uploadUrl: 'https://s3.amazonaws.com/presigned-put' }),
    });
    global.fetch = mockFetch;

    const file = new File(['hello'], 'document.pdf', { type: 'application/pdf' });
    const res = await api.requestUploadUrl(file, 'FOLDER-123');

    expect(res.uploadUrl).toBe('https://s3.amazonaws.com/presigned-put');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.com/files/upload-url',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-jwt-token',
        }),
      })
    );
  });
});
