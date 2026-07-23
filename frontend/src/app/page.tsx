'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  HardDrive, ArrowRight, ShieldCheck, Zap, Server, Trash2, Clock,
  Lock, RefreshCw, Eye, FolderTree, Cpu, CheckCircle2, ChevronRight,
  Terminal, Sparkles, Database, Layers, ArrowUpRight, Play, Check,
  Activity, Sliders, FileUp, Sparkle, Command, ShieldAlert, Radio
} from 'lucide-react';

export default function FuturisticLandingPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Interactive Upload Simulator State
  const [simFile, setSimFile] = useState<string | null>(null);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simStatus, setSimStatus] = useState<string>('IDLE');
  const [simLog, setSimLog] = useState<string[]>([
    'SYSTEM READY // AWS ap-south-1',
    'S3 Presigned Direct-Engine Standby...'
  ]);

  // Interactive Storage Calculator State
  const [storageGb, setStorageGb] = useState<number>(250);
  const estimatedCost = (storageGb * 0.0125).toFixed(2);
  const traditionalCost = (storageGb * 0.045).toFixed(2);

  // Console Active Tab
  const [activeConsoleTab, setActiveConsoleTab] = useState<'upload' | 'ttl' | 'security' | 'sorting'>('upload');

  const handleLaunch = () => {
    router.push('/login');
  };

  // Interactive Particle Grid Canvas Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes setup
    const particleCount = Math.min(60, Math.floor(width / 25));
    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.5,
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 40;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update and draw particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Connect particles within distance
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * (1 - dist / 120)})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Connect to mouse
        const mdx = p.x - mouseX;
        const mdy = p.y - mouseY;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 160) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 * (1 - mdist / 160)})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Run Simulator
  const runSimulatedUpload = (filename: string) => {
    setSimFile(filename);
    setSimStatus('SIGNING');
    setSimProgress(15);
    setSimLog([
      `Initiated direct upload for "${filename}"`,
      `[POST] /api/v1/files/upload-url ➔ HTTP 200 OK`,
      `Signature: S3 Presigned PUT (AWS HMAC-SHA256)`
    ]);

    setTimeout(() => {
      setSimStatus('UPLOADING');
      setSimProgress(65);
      setSimLog(prev => [
        ...prev,
        `Streaming binary direct to S3 bucket (ap-south-1)...`,
        `Transfer rate: 450 MB/s (Direct S3 Endpoint)`
      ]);

      setTimeout(() => {
        setSimStatus('COMPLETE');
        setSimProgress(100);
        setSimLog(prev => [
          ...prev,
          `✔ Upload verified. StorageClass: INTELLIGENT_TIERING`,
          `DynamoDB metadata indexed: USER#1029 / FILE#9941`
        ]);
      }, 700);
    }, 600);
  };

  return (
    <div className="min-h-screen w-screen bg-[#030303] text-zinc-100 relative overflow-x-hidden font-sans selection:bg-white selection:text-black">
      {/* Dynamic Interactive Particle Grid Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Cyber Scanline Effect Overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#000000_90%)] pointer-events-none z-0 opacity-80" />

      {/* Monospace HUD Corner Crosshairs */}
      <div className="fixed top-4 left-4 font-mono text-[10px] text-zinc-700 pointer-events-none z-20 hidden lg:block">+ LAT: 19.0760 // LON: 72.8777</div>
      <div className="fixed top-4 right-4 font-mono text-[10px] text-zinc-700 pointer-events-none z-20 hidden lg:block">+ SYS_STATE // ONLINE</div>
      <div className="fixed bottom-4 left-4 font-mono text-[10px] text-zinc-700 pointer-events-none z-20 hidden lg:block">+ REGION // ap-south-1</div>
      <div className="fixed bottom-4 right-4 font-mono text-[10px] text-zinc-700 pointer-events-none z-20 hidden lg:block">+ ENCRYPTION // AES-256-GCM</div>

      {/* Glassmorphic Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#030303]/80 border-b border-white/10 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/20 flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-wider text-white flex items-center gap-2 font-mono">
                CDRIVE <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 border border-white/20 text-zinc-300">SYSTEMS</span>
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-xs font-mono text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-zinc-500" /> Architecture</a>
            <a href="#demo" className="hover:text-white transition-colors flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-zinc-500" /> Live Telemetry</a>
            <a href="#calculator" className="hover:text-white transition-colors flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-zinc-500" /> Cost Meter</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLaunch}
              className="px-4 py-2 rounded-lg text-xs font-mono text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800 transition-all cursor-pointer"
            >
              [ LOGIN ]
            </button>
            <button
              onClick={handleLaunch}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
            >
              <span>INITIALIZE DRIVE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-6xl mx-auto text-center flex flex-col items-center gap-8 z-10">
        {/* HUD Pill Tag */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-white/15 text-[11px] font-mono text-zinc-300 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>SYS_ENGINE // DIRECT S3 PRESIGNED PROTOCOL</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 max-w-5xl leading-[1.08]">
          OBSIDIAN CLOUD STORAGE FOR DEVELOPERS & CREATORS.
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed font-sans">
          Bypasses traditional web server bottlenecks via client-to-S3 presigned URLs. Automated 25-day DynamoDB TTL trash purging and instant in-browser media rendering.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <button
            onClick={handleLaunch}
            className="w-full sm:w-auto px-9 py-4 rounded-xl bg-white hover:bg-zinc-100 text-black font-mono font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
          >
            <span>LAUNCH APPLICATION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="https://github.com/anilvinnakoti/CDrive"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-950/80 border border-white/15 hover:border-white/30 text-zinc-300 font-mono text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
          >
            <span>[ VIEW SOURCE ]</span>
            <ArrowUpRight className="w-4 h-4 text-zinc-500" />
          </a>
        </div>
      </section>

      {/* Interactive Drag & Drop Upload Simulator Component */}
      <section id="demo" className="py-12 px-6 max-w-5xl mx-auto z-10 relative">
        <div className="bg-zinc-950/90 border border-white/15 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                  INTERACTIVE S3 ENGINE SIMULATOR <span className="text-[10px] text-emerald-400 font-normal">[ LIVE DEMO ]</span>
                </h3>
                <p className="text-xs text-zinc-400">Click a sample file below to simulate presigned S3 URL upload execution</p>
              </div>
            </div>

            {/* Quick Sample Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => runSimulatedUpload('dataset_final.json')}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-white/30 text-xs font-mono text-zinc-300 transition-colors cursor-pointer"
              >
                + dataset_final.json
              </button>
              <button
                onClick={() => runSimulatedUpload('arch_diagram.pdf')}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-white/30 text-xs font-mono text-zinc-300 transition-colors cursor-pointer"
              >
                + arch_diagram.pdf
              </button>
              <button
                onClick={() => runSimulatedUpload('demo_video.mp4')}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-white/30 text-xs font-mono text-zinc-300 transition-colors cursor-pointer"
              >
                + demo_video.mp4
              </button>
            </div>
          </div>

          {/* Execution Progress Bar */}
          {simFile && (
            <div className="bg-zinc-900/80 p-4 rounded-xl border border-white/10 flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between text-zinc-300 font-medium">
                <span className="flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-emerald-400" /> {simFile}
                </span>
                <span className="text-emerald-400">{simProgress}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-zinc-500 via-white to-emerald-400 transition-all duration-300" style={{ width: `${simProgress}%` }} />
              </div>
            </div>
          )}

          {/* Terminal Console Logs Output */}
          <div className="bg-black/90 rounded-2xl p-5 border border-white/10 font-mono text-xs min-h-[160px] flex flex-col gap-2">
            <div className="text-zinc-600 border-b border-zinc-900 pb-2 flex justify-between">
              <span>CDrive Engine Telemetry Log</span>
              <span>STATE: {simStatus}</span>
            </div>
            {simLog.map((logLine, idx) => (
              <div key={idx} className="flex items-center gap-2 text-zinc-300 animate-fadeIn">
                <span className="text-zinc-600">&gt;</span>
                <span>{logLine}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cyber Feature Grid Matrix */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto z-10 relative">
        <div className="text-center flex flex-col items-center gap-3 mb-16">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">[ ENGINE ARCHITECTURE ]</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">Built for zero latency.</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">Every component is engineered around AWS serverless primitives.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-7 rounded-3xl bg-zinc-950/70 border border-white/10 hover:border-white/30 hover:scale-[1.01] transition-all backdrop-blur-xl flex flex-col gap-4 group shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:border-white/30 transition-colors">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg text-white font-sans">Direct S3 Presigned PUTs</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Browser streams binary objects directly into Amazon S3 using HMAC-SHA256 presigned URLs. Bypasses Lambda memory limits and API Gateway payload limits.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-zinc-950/70 border border-white/10 hover:border-white/30 hover:scale-[1.01] transition-all backdrop-blur-xl flex flex-col gap-4 group shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:border-white/30 transition-colors">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg text-white font-sans">Single-Table Isolation</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Single-table Amazon DynamoDB design with strict `USER#&lt;ID&gt;` partition keys ensuring zero multi-tenant data leakage across accounts.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-zinc-950/70 border border-white/10 hover:border-white/30 hover:scale-[1.01] transition-all backdrop-blur-xl flex flex-col gap-4 group shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:border-white/30 transition-colors">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg text-white font-sans">25-Day TTL Auto-Purge</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Trashed files automatically set DynamoDB `TTL = UnixTimestamp(now + 25 days)`. AWS background engines execute zero-cost automated purges.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-zinc-950/70 border border-white/10 hover:border-white/30 hover:scale-[1.01] transition-all backdrop-blur-xl flex flex-col gap-4 group shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:border-white/30 transition-colors">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg text-white font-sans">In-Browser Media Player</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Stream MP4 videos, MP3 audio, full-resolution images, and PDF documents inside a sleek glassmorphic preview modal.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-zinc-950/70 border border-white/10 hover:border-white/30 hover:scale-[1.01] transition-all backdrop-blur-xl flex flex-col gap-4 group shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:border-white/30 transition-colors">
              <FolderTree className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg text-white font-sans">Google Drive Sorting</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Folders are pinned to the top of every directory view, with instant sorting by Name (A-Z), Modified Date, or File Size.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-zinc-950/70 border border-white/10 hover:border-white/30 hover:scale-[1.01] transition-all backdrop-blur-xl flex flex-col gap-4 group shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:border-white/30 transition-colors">
              <Server className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg text-white font-sans">AWS Intelligent-Tiering</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Automatic S3 lifecycle transitions move cold objects to cost-effective storage tiers with zero retrieval penalties.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Storage & Cost Meter Calculator */}
      <section id="calculator" className="py-16 px-6 max-w-4xl mx-auto z-10 relative">
        <div className="bg-zinc-950 border border-white/15 p-8 sm:p-10 rounded-3xl backdrop-blur-2xl flex flex-col gap-8 shadow-2xl">
          <div className="flex flex-col items-center text-center gap-2">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">[ COST OPTIMIZATION ]</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">AWS Intelligent-Tiering Estimator</h3>
            <p className="text-xs text-zinc-400">Drag the slider to calculate your estimated monthly AWS S3 storage cost</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400">STORAGE VOLUME:</span>
              <span className="text-white font-bold text-base">{storageGb} GB</span>
            </div>
            <input
              type="range"
              min="10"
              max="5000"
              step="10"
              value={storageGb}
              onChange={(e) => setStorageGb(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-mono">
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 flex flex-col gap-1">
              <span className="text-[11px] text-zinc-400">CDrive S3 Intelligent-Tiering</span>
              <span className="text-2xl font-bold text-emerald-400">${estimatedCost} / mo</span>
              <span className="text-[10px] text-zinc-500">Auto-transitions to deep archive tiers</span>
            </div>
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 flex flex-col gap-1">
              <span className="text-[11px] text-zinc-400">Traditional Cloud Storage</span>
              <span className="text-2xl font-bold text-zinc-500 line-through">${traditionalCost} / mo</span>
              <span className="text-[10px] text-zinc-500">Fixed rate pricing without tiering</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final Launch CTA */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center z-10 relative">
        <div className="p-12 sm:p-16 rounded-3xl bg-gradient-to-b from-zinc-900 to-black border border-white/15 flex flex-col items-center gap-6 shadow-[0_0_100px_rgba(0,0,0,0.95)]">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">Initialize CDrive in seconds.</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md font-sans">
            Authenticate via Google OAuth 2.0 and manage your personal cloud storage with zero friction.
          </p>
          <button
            onClick={handleLaunch}
            className="px-9 py-4 rounded-xl bg-white hover:bg-zinc-100 text-black font-mono font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-[1.03]"
          >
            <span>INITIALIZE APPLICATION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs font-mono text-zinc-600 flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto gap-4 z-10 relative">
        <span>CDrive Systems // AWS Serverless S3 Architecture</span>
        <div className="flex items-center gap-6">
          <button onClick={handleLaunch} className="hover:text-zinc-300 transition-colors">[ LOGIN ]</button>
          <a href="https://github.com/anilvinnakoti/CDrive" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">[ GITHUB ]</a>
        </div>
      </footer>
    </div>
  );
}
