'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HardDrive, ArrowRight, ShieldCheck, Zap, Server, Trash2, Clock,
  Lock, RefreshCw, Eye, FolderTree, Cpu, CheckCircle2, ChevronRight,
  Terminal, Sparkles, Database, Layers, ArrowUpRight
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [activeDemoTab, setActiveDemoTab] = useState<'upload' | 'ttl' | 'previews' | 'sorting'>('upload');

  const handleLaunchClick = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen w-screen bg-[#050505] text-zinc-100 relative overflow-x-hidden font-sans selection:bg-white selection:text-black">
      {/* Futuristic Ambient Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Ambient Radial Light Spot */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-zinc-700/20 via-zinc-800/10 to-transparent blur-3xl pointer-events-none" />

      {/* Cyber Glassmorphic Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#050505]/70 border-b border-white/10 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
              <HardDrive className="w-5 h-5 text-zinc-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-zinc-100 tracking-tight flex items-center gap-2">
                CDrive <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">v2.0</span>
              </span>
            </div>
          </div>

          {/* Telemetry Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SYS_OK // AWS ap-south-1</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLaunchClick}
              title="Sign in to CDrive"
              className="hidden sm:inline-flex px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={handleLaunchClick}
              title="Launch CDrive application"
              className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]"
            >
              <span>Initialize Drive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-6xl mx-auto text-center flex flex-col items-center gap-8">
        {/* Monospace Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-300 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span>[ PROTOCOL v2.0 // AWS S3 SERVERLESS STORAGE ]</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 max-w-4xl leading-[1.1]">
          Minimalist cloud storage built for speed & scale.
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          Direct client-to-S3 presigned URL uploads, 25-day DynamoDB TTL trash auto-purge, in-browser media previewers, and zero server bandwidth bottleneck.
        </p>

        {/* Dual Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <button
            onClick={handleLaunchClick}
            title="Get Started Free with CDrive"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02]"
          >
            <span>Get Started for Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="https://github.com/anilvinnakoti/CDrive"
            target="_blank"
            rel="noreferrer"
            title="View CDrive GitHub repository"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View Architecture</span>
            <ArrowUpRight className="w-4 h-4 text-zinc-500" />
          </a>
        </div>

        {/* Telemetry Stat Pill Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl pt-10">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 flex flex-col items-center gap-1 backdrop-blur-md">
            <span className="font-mono text-lg font-bold text-white">0.0 ms</span>
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-mono">Server Proxy Overhead</span>
          </div>
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 flex flex-col items-center gap-1 backdrop-blur-md">
            <span className="font-mono text-lg font-bold text-white">100%</span>
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-mono">Serverless ARM64</span>
          </div>
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 flex flex-col items-center gap-1 backdrop-blur-md">
            <span className="font-mono text-lg font-bold text-white">25-Day</span>
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-mono">DynamoDB TTL Purge</span>
          </div>
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 flex flex-col items-center gap-1 backdrop-blur-md">
            <span className="font-mono text-lg font-bold text-white">256-bit</span>
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-mono">S3 AES Encryption</span>
          </div>
        </div>
      </section>

      {/* Holographic Interactive Console Demo Section */}
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          {/* Console Header Bar */}
          <div className="px-5 py-3 bg-zinc-900/80 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-zinc-700" />
              <span className="w-3 h-3 rounded-full bg-zinc-800" />
              <span className="w-3 h-3 rounded-full bg-zinc-800" />
              <span className="text-xs font-mono text-zinc-400 ml-2">cdrive-console // live_telemetry.sys</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveDemoTab('upload')}
                className={`px-3 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${activeDemoTab === 'upload' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Presigned Upload
              </button>
              <button
                onClick={() => setActiveDemoTab('ttl')}
                className={`px-3 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${activeDemoTab === 'ttl' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                25-Day TTL
              </button>
              <button
                onClick={() => setActiveDemoTab('previews')}
                className={`px-3 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${activeDemoTab === 'previews' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Media Previews
              </button>
              <button
                onClick={() => setActiveDemoTab('sorting')}
                className={`px-3 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${activeDemoTab === 'sorting' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Drive Sorting
              </button>
            </div>
          </div>

          {/* Console Content Window */}
          <div className="p-6 font-mono text-xs text-zinc-300 leading-relaxed bg-[#030303] min-h-[220px]">
            {activeDemoTab === 'upload' && (
              <div className="flex flex-col gap-2">
                <div className="text-zinc-500">// Requesting S3 Presigned URL for direct binary upload</div>
                <div><span className="text-emerald-400">POST</span> /api/v1/files/upload-url</div>
                <div className="text-zinc-400 font-mono bg-zinc-900/60 p-3 rounded border border-zinc-800">
                  {`{ "fileName": "project_report.pdf", "mimeType": "application/pdf", "folderId": "ROOT" }`}
                </div>
                <div className="text-emerald-400 flex items-center gap-2 pt-1">
                  <CheckCircle2 className="w-4 h-4" /> 200 OK — S3 Presigned PUT URL generated (Direct Browser ➔ AWS S3)
                </div>
              </div>
            )}

            {activeDemoTab === 'ttl' && (
              <div className="flex flex-col gap-2">
                <div className="text-zinc-500">// DynamoDB Single-Table Time-To-Live (TTL) Auto-Purge Rule</div>
                <div><span className="text-purple-400">UPDATE</span> CustomDriveData-dev SET IsTrashed = true, #ttl = :ttl</div>
                <div className="text-zinc-400 bg-zinc-900/60 p-3 rounded border border-zinc-800">
                  {`{ "PK": "USER#10293", "SK": "FILE#7741", "TTL": 1787443200, "Expiry": "25 Days from now" }`}
                </div>
                <div className="text-purple-400 flex items-center gap-2 pt-1">
                  <Clock className="w-4 h-4" /> Automated AWS DynamoDB background purge scheduled after 25 days
                </div>
              </div>
            )}

            {activeDemoTab === 'previews' && (
              <div className="flex flex-col gap-2">
                <div className="text-zinc-500">// Native In-Browser Document & Multi-Media Streaming</div>
                <div><span className="text-blue-400">GET</span> /api/v1/files/download-url?fileId=FILE-8832</div>
                <div className="text-zinc-400 bg-zinc-900/60 p-3 rounded border border-zinc-800">
                  {`Formats Supported: PDF Viewer, Image Lightbox, HTML5 Video Player, Audio Player, Code Viewer`}
                </div>
                <div className="text-blue-400 flex items-center gap-2 pt-1">
                  <Eye className="w-4 h-4" /> Instant rendering without server transcoding delay
                </div>
              </div>
            )}

            {activeDemoTab === 'sorting' && (
              <div className="flex flex-col gap-2">
                <div className="text-zinc-500">// Google Drive Style Item Grouping & Ordering</div>
                <div><span className="text-amber-400">SORT</span> Folders First ➔ Alphabetical Name (A-Z) / Last Modified / Size</div>
                <div className="text-zinc-400 bg-zinc-900/60 p-3 rounded border border-zinc-800">
                  {`1. [FOLDER] Documents/\n2. [FOLDER] Photographs/\n3. [FILE] architecture.pdf (2.4 MB)\n4. [FILE] budget.xlsx (120 KB)`}
                </div>
                <div className="text-amber-400 flex items-center gap-2 pt-1">
                  <FolderTree className="w-4 h-4" /> Folders always pinned to top of directory view
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cyber Glassmorphic Feature Matrix Grid */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center flex flex-col items-center gap-3 mb-16">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">[ ENGINE ARCHITECTURE ]</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Engineered for extreme performance.</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">Clean single-table DynamoDB design integrated with AWS S3 presigned primitives.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/30 hover:scale-[1.01] transition-all backdrop-blur-xl shadow-xl flex flex-col gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 group-hover:border-zinc-600 transition-colors">
              <Zap className="w-5 h-5 text-zinc-200" />
            </div>
            <h3 className="font-semibold text-base text-white">Direct Presigned S3 Uploads</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload binaries straight from your browser to S3 via presigned URLs. No server bottlenecks or Memory overhead.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/30 hover:scale-[1.01] transition-all backdrop-blur-xl shadow-xl flex flex-col gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 group-hover:border-zinc-600 transition-colors">
              <Lock className="w-5 h-5 text-zinc-200" />
            </div>
            <h3 className="font-semibold text-base text-white">Multi-Tenant User Isolation</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Partitioned using single-table `USER#&lt;ID&gt;` DynamoDB keys and isolated S3 object prefixes for strict security.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/30 hover:scale-[1.01] transition-all backdrop-blur-xl shadow-xl flex flex-col gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 group-hover:border-zinc-600 transition-colors">
              <Server className="w-5 h-5 text-zinc-200" />
            </div>
            <h3 className="font-semibold text-base text-white">AWS Intelligent-Tiering</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Automatic S3 lifecycle management moves unused files to cost-effective storage classes with zero retrieval fee penalties.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/30 hover:scale-[1.01] transition-all backdrop-blur-xl shadow-xl flex flex-col gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 group-hover:border-zinc-600 transition-colors">
              <Trash2 className="w-5 h-5 text-zinc-200" />
            </div>
            <h3 className="font-semibold text-base text-white">25-Day TTL Trash Auto-Purge</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Trashed items automatically expire after 25 days via DynamoDB Time-To-Live specification, or can be deleted manually.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/30 hover:scale-[1.01] transition-all backdrop-blur-xl shadow-xl flex flex-col gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 group-hover:border-zinc-600 transition-colors">
              <Eye className="w-5 h-5 text-zinc-200" />
            </div>
            <h3 className="font-semibold text-base text-white">In-Browser Media Previews</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Preview PDFs, images, MP4 videos, MP3 audio, and code snippets directly inside an ultra-fast glassmorphic modal.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/30 hover:scale-[1.01] transition-all backdrop-blur-xl shadow-xl flex flex-col gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 group-hover:border-zinc-600 transition-colors">
              <FolderTree className="w-5 h-5 text-zinc-200" />
            </div>
            <h3 className="font-semibold text-base text-white">Google Drive Style Sorting</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Folders are pinned to the top of every directory view, with instant sorting by Name (A-Z), Modified Date, or File Size.
            </p>
          </div>
        </div>
      </section>

      {/* Final Call To Action Banner */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-white/10 flex flex-col items-center gap-6 shadow-[0_0_80px_rgba(0,0,0,0.9)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_300px_at_50%_0px,#ffffff0f,transparent)] pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Ready to experience CDrive?</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
            Sign in with your Google account and start managing files with zero storage friction.
          </p>
          <button
            onClick={handleLaunchClick}
            title="Launch CDrive Application"
            className="px-8 py-3.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.03]"
          >
            <span>Launch CDrive Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs font-mono text-zinc-500 flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto gap-4">
        <span>© 2026 CDrive Cloud Storage. Built with AWS SAM & Next.js.</span>
        <div className="flex items-center gap-4">
          <button onClick={handleLaunchClick} className="hover:text-zinc-300 transition-colors">Sign In</button>
          <a href="https://github.com/anilvinnakoti/CDrive" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
