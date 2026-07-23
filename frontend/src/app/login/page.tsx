'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { HardDrive, ShieldCheck, Key, ExternalLink, CheckCircle } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [clientId, setClientId] = useState<string>('');
  const [inputClientId, setInputClientId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (api.getToken()) {
      router.replace('/drive');
      return;
    }

    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const storedClientId = typeof window !== 'undefined' ? localStorage.getItem('cdrive_google_client_id') : null;
    const activeId = storedClientId || envClientId || '';

    setClientId(activeId);
    if (activeId) {
      setInputClientId(activeId);
    }
  }, [router]);

  // Load Google SDK script once
  useEffect(() => {
    if (!clientId) return;

    const loadAndRender = () => {
      if (window.google?.accounts?.id) {
        renderGoogleButton(clientId);
      } else {
        const existingScript = document.getElementById('google-gsi-script');
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = 'google-gsi-script';
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.onload = () => renderGoogleButton(clientId);
          document.body.appendChild(script);
        } else {
          const poll = setInterval(() => {
            if (window.google?.accounts?.id) {
              clearInterval(poll);
              renderGoogleButton(clientId);
            }
          }, 100);
        }
      }
    };

    const t = setTimeout(loadAndRender, 100);
    return () => clearTimeout(t);
  }, [clientId]);

  const renderGoogleButton = (activeClientId: string) => {
    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: activeClientId,
      callback: handleGoogleCallback,
    });

    const btnDiv = document.getElementById('googleSignInBtn');
    if (btnDiv) {
      btnDiv.innerHTML = '';
      window.google.accounts.id.renderButton(btnDiv, {
        theme: 'filled_dark',
        size: 'large',
        width: '320',
        shape: 'pill',
      });
    }
  };

  const handleGoogleCallback = async (response: any) => {
    setLoading(true);
    setError('');
    try {
      if (response.credential) {
        await api.loginWithGoogle(response.credential);
        router.push('/drive');
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputClientId.trim()) return;

    const trimmed = inputClientId.trim();
    localStorage.setItem('cdrive_google_client_id', trimmed);
    setClientId(trimmed);
    setSavedSuccess(true);
    setError('');

    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen w-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden text-zinc-100">
      <div className="w-full max-w-md p-8 flex flex-col gap-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-center shadow-xl">
        {/* Minimalist Monochromatic Header Branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100">
            <HardDrive className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-medium tracking-tight text-zinc-100">CDrive</h1>
          <p className="text-xs text-zinc-400">Minimalist Cloud Storage</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-xs text-zinc-300 text-center font-mono">
            {error}
          </div>
        )}

        {/* Saved Success Alert */}
        {savedSuccess && (
          <div className="bg-zinc-950 border border-zinc-700 p-3 rounded-xl text-xs text-zinc-200 text-center font-medium flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-zinc-400" /> Client ID Configured
          </div>
        )}

        {/* Google OAuth Button Container */}
        {clientId ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-xs text-zinc-400">Sign in with your Google account to access your drive:</p>
            <div id="googleSignInBtn" className="min-h-[44px] flex justify-center w-full" />
            {loading && <p className="text-xs text-zinc-400 animate-pulse font-medium">Authenticating...</p>}

            <button
              onClick={() => {
                localStorage.removeItem('cdrive_google_client_id');
                setClientId('');
              }}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors pt-2"
            >
              Change Google OAuth Client ID
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveClientId} className="flex flex-col gap-4 text-left bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-200 font-medium text-xs">
              <Key className="w-4 h-4 text-zinc-400" /> Setup Google OAuth Client ID
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Enter your Google Cloud OAuth 2.0 Client ID to enable Google Sign-In:
            </p>

            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                required
                placeholder="xxxxxx-xxxxxxxx.apps.googleusercontent.com"
                value={inputClientId}
                onChange={(e) => setInputClientId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-600 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition-colors"
            >
              Save Client ID & Enable Google Sign-In
            </button>

            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1 pt-1"
            >
              Get Client ID from Google Cloud Console <ExternalLink className="w-3 h-3" />
            </a>
          </form>
        )}

        {/* Footer Security Badge */}
        <div className="flex items-center justify-center gap-2 text-zinc-500 text-[11px] pt-3 border-t border-zinc-800/80">
          <ShieldCheck className="w-4 h-4 text-zinc-400" />
          <span>OAuth 2.0 Encrypted Cloud Storage</span>
        </div>
      </div>
    </div>
  );
}
