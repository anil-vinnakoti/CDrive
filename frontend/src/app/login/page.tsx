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
      router.replace('/');
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
        // SDK already loaded — reinitialize and render immediately
        renderGoogleButton(clientId);
      } else {
        // Load SDK fresh
        const existingScript = document.getElementById('google-gsi-script');
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = 'google-gsi-script';
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.onload = () => renderGoogleButton(clientId);
          document.body.appendChild(script);
        } else {
          // Script tag exists but SDK may not have initialized yet — poll
          const poll = setInterval(() => {
            if (window.google?.accounts?.id) {
              clearInterval(poll);
              renderGoogleButton(clientId);
            }
          }, 100);
        }
      }
    };

    // Small timeout to ensure React has rendered #googleSignInBtn into the DOM
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
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
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
    <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-panel w-full max-w-md p-8 flex flex-col gap-6 z-10 shadow-2xl border border-white/10 relative text-center">
        {/* Header Branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <HardDrive className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">CDrive Storage</h1>
          <p className="text-xs text-slate-400">Google OAuth 2.0 Single Sign-On</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-xs text-rose-300 text-center font-medium">
            {error}
          </div>
        )}

        {/* Saved Success Alert */}
        {savedSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-300 text-center font-medium flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> Google Client ID Configured!
          </div>
        )}

        {/* Google OAuth Button Container */}
        {clientId ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-xs text-slate-300">Sign in with your Google account to access your drive:</p>
            <div id="googleSignInBtn" className="min-h-[44px] flex justify-center w-full" />
            {loading && <p className="text-xs text-indigo-400 animate-pulse font-medium">Authenticating with Google...</p>}
            
            <button
              onClick={() => {
                localStorage.removeItem('cdrive_google_client_id');
                setClientId('');
              }}
              className="text-[11px] text-slate-500 hover:text-slate-400 underline pt-2"
            >
              Change Google OAuth Client ID
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveClientId} className="flex flex-col gap-4 text-left bg-slate-900/90 p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
              <Key className="w-4 h-4" /> Setup Google OAuth Client ID
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enter your Google Cloud OAuth 2.0 Client ID to enable 1-click Google Sign-In for CDrive:
            </p>

            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                required
                placeholder="xxxxxx-xxxxxxxx.apps.googleusercontent.com"
                value={inputClientId}
                onChange={(e) => setInputClientId(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all"
            >
              Save Client ID & Enable Google Sign-In
            </button>

            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 pt-1"
            >
              Get a free Client ID from Google Cloud Console <ExternalLink className="w-3 h-3" />
            </a>
          </form>
        )}

        {/* Footer Security Badge */}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-[11px] pt-3 border-t border-white/5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>OAuth 2.0 Verified 256-Bit SSL Cloud Storage</span>
        </div>
      </div>
    </div>
  );
}
