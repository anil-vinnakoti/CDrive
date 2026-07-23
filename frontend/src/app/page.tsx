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

  // Mouse Tracking Spotlight
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });

  // Scroll state for glossy header when reaching top/scrolling
  const [isScrolled, setIsScrolled] = useState(false);

  // AWS Region Switcher State
  const [activeRegion, setActiveRegion] = useState<{ name: string; latency: string; code: string }>({
    name: 'ap-south-1 (Mumbai)',
    latency: '12ms',
    code: 'AP_SOUTH_1'
  });

  // Interactive Upload Simulator State
  const [simFile, setSimFile] = useState<string | null>(null);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simStatus, setSimStatus] = useState<string>('STANDBY');
  const [simLog, setSimLog] = useState<string[]>([
    'SYSTEM ONLINE // AWS ap-south-1',
    'S3 Presigned Direct Engine Standby...'
  ]);

  // Interactive Storage Calculator State
  const [storageGb, setStorageGb] = useState<number>(250);
  const [isSliding, setIsSliding] = useState<boolean>(false);

  const formattedVolume = storageGb >= 1000
    ? `${(storageGb / 1000).toFixed(1)} TB`
    : `${storageGb} GB`;

  const estimatedCost = (storageGb * 0.0125).toFixed(2);
  const traditionalCost = (storageGb * 0.045).toFixed(2);

  const handleLaunch = () => {
    router.push('/login');
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Scroll listener for sticky header glass glossiness
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse Follower & Monochromatic Canvas Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

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

    const particleCount = Math.min(60, Math.floor(width / 25));
    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.2 + 0.4,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Fine Monochromatic Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
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

      // Monochromatic Particles & Connections
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - dist / 120)})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const runSimulatedUpload = (filename: string) => {
    setSimFile(filename);
    setSimStatus('SIGNING');
    setSimProgress(15);
    setSimLog([
      `Initiating presigned upload request for "${filename}"`,
      `[POST] /api/v1/files/upload-url ➔ HTTP 200 OK (${activeRegion.latency})`,
      `HMAC-SHA256 Presigned PUT signature generated`
    ]);

    setTimeout(() => {
      setSimStatus('UPLOADING');
      setSimProgress(65);
      setSimLog(prev => [
        ...prev,
        `Uploading binary direct to S3 bucket (${activeRegion.code})...`,
        `Direct transfer rate: 450 MB/s (No server proxy)`
      ]);

      setTimeout(() => {
        setSimStatus('COMPLETE');
        setSimProgress(100);
        setSimLog(prev => [
          ...prev,
          `✔ Upload verified. StorageClass: INTELLIGENT_TIERING`,
          `Single-table DynamoDB index updated: USER#1029 / FILE#9941`
        ]);
      }, 700);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-[#050507] text-zinc-100 relative font-sans selection:bg-white selection:text-black">
      {/* Monochromatic Cursor Spotlight Glow */}
      <div
        style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
        className="fixed w-[450px] h-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03] blur-[120px] pointer-events-none z-0 transition-opacity duration-300"
      />

      {/* Dynamic Monochromatic Canvas Particle Grid */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Cyber Scanline Overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#000000_90%)] pointer-events-none z-0 opacity-80" />

      {/* Monospace HUD Corners */}
      <div className="fixed top-4 left-4 font-mono text-[10px] text-zinc-600 pointer-events-none z-20 hidden lg:block tracking-widest">+ LAT: 19.0760 // LON: 72.8777</div>
      <div className="fixed top-4 right-4 font-mono text-[10px] text-zinc-400 pointer-events-none z-20 hidden lg:block tracking-widest flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse" />
        <span>+ REGION: {activeRegion.name} [{activeRegion.latency}]</span>
      </div>

      {/* Floating Apple VisionOS Liquid Glass Island Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-3 pointer-events-none">
        <div
          style={{
            backdropFilter: 'blur(32px) saturate(200%) brightness(110%)',
            WebkitBackdropFilter: 'blur(32px) saturate(200%) brightness(110%)',
            backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            borderColor: isScrolled ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.1)',
            boxShadow: isScrolled
              ? '0 20px 50px 0 rgba(0, 0, 0, 0.65), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 0 rgba(255, 255, 255, 0.1)'
              : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.25)',
          }}
          className="max-w-7xl mx-auto rounded-2xl border px-6 py-3 flex items-center justify-between pointer-events-auto transition-all duration-300"
        >
          <div className="flex items-center gap-3 group cursor-pointer" onClick={handleLaunch}>
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/20 flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,255,255,0.08)] group-hover:border-white/40 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all">
              <HardDrive className="w-5 h-5 text-white transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-wider text-white flex items-center gap-2 font-mono">
                CDRIVE <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">SYSTEMS</span>
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-xs font-mono text-zinc-400">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-white transition-colors flex items-center gap-1.5 hover:translate-y-[-1px] transition-all"><Layers className="w-3.5 h-3.5 text-zinc-500" /> Architecture</a>
            <a href="#demo" onClick={(e) => scrollToSection(e, 'demo')} className="hover:text-white transition-colors flex items-center gap-1.5 hover:translate-y-[-1px] transition-all"><Terminal className="w-3.5 h-3.5 text-zinc-500" /> S3 Telemetry</a>
            <a href="#calculator" onClick={(e) => scrollToSection(e, 'calculator')} className="hover:text-white transition-colors flex items-center gap-1.5 hover:translate-y-[-1px] transition-all"><Sliders className="w-3.5 h-3.5 text-zinc-500" /> Cost Meter</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLaunch}
              className="btn-secondary px-4 py-2 rounded-xl text-xs cursor-pointer"
            >
              [ LOGIN ]
            </button>
            <button
              onClick={handleLaunch}
              className="btn-primary px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer"
            >
              <span>INITIALIZE DRIVE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-6xl mx-auto text-center flex flex-col items-center gap-8 z-10">
        {/* Monochromatic Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-300 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-zinc-300 animate-pulse" />
          <span>SYS_ENGINE // DIRECT S3 PRESIGNED PROTOCOL</span>
        </div>

        {/* Refined Minimalist Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 max-w-4xl leading-[1.1]">
          Serverless cloud storage, refined.
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed font-sans">
          Direct client-to-S3 presigned uploads, 25-day DynamoDB TTL trash auto-purging, single-table multi-tenant isolation, and zero server bandwidth overhead.
        </p>

        {/* Hero Dual CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <button
            onClick={handleLaunch}
            className="btn-primary px-9 py-4 rounded-xl text-xs tracking-wider cursor-pointer flex items-center justify-center gap-3"
          >
            <span>LAUNCH APPLICATION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="https://github.com/anil-vinnakoti/CDrive"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary px-8 py-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>[ VIEW SOURCE ]</span>
            <ArrowUpRight className="w-4 h-4 text-zinc-500" />
          </a>
        </div>
      </section>

      {/* Interactive S3 Upload Simulator */}
      <section id="demo" className="py-12 px-6 max-w-5xl mx-auto z-10 relative">
        <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-[0_0_60px_rgba(0,0,0,0.9)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                  INTERACTIVE S3 ENGINE SIMULATOR <span className="text-[10px] text-zinc-400 font-normal">[ LIVE DEMO ]</span>
                </h3>
                <p className="text-xs text-zinc-400">Click a sample file below to simulate presigned S3 URL upload execution</p>
              </div>
            </div>

            {/* Region Selector Bar */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-500">REGION:</span>
              <button
                onClick={() => setActiveRegion({ name: 'ap-south-1 (Mumbai)', latency: '12ms', code: 'AP_SOUTH_1' })}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${activeRegion.code === 'AP_SOUTH_1' ? 'bg-zinc-800 border border-zinc-700 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Mumbai [12ms]
              </button>
              <button
                onClick={() => setActiveRegion({ name: 'us-east-1 (Virginia)', latency: '18ms', code: 'US_EAST_1' })}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${activeRegion.code === 'US_EAST_1' ? 'bg-zinc-800 border border-zinc-700 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                US-East [18ms]
              </button>
            </div>
          </div>

          {/* Sample Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => runSimulatedUpload('dataset_final.json')}
              className="btn-secondary px-3.5 py-1.5 rounded-lg text-xs cursor-pointer"
            >
              + dataset_final.json
            </button>
            <button
              onClick={() => runSimulatedUpload('arch_diagram.pdf')}
              className="btn-secondary px-3.5 py-1.5 rounded-lg text-xs cursor-pointer"
            >
              + arch_diagram.pdf
            </button>
            <button
              onClick={() => runSimulatedUpload('demo_video.mp4')}
              className="btn-secondary px-3.5 py-1.5 rounded-lg text-xs cursor-pointer"
            >
              + demo_video.mp4
            </button>
          </div>

          {/* Execution Progress Bar */}
          {simFile && (
            <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between text-zinc-300 font-medium">
                <span className="flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-zinc-300" /> {simFile}
                </span>
                <span className="text-white font-bold">{simProgress}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-zinc-600 via-zinc-400 to-white transition-all duration-300" style={{ width: `${simProgress}%` }} />
              </div>
            </div>
          )}

          {/* Terminal Console Logs */}
          <div className="bg-black/95 rounded-2xl p-5 border border-white/10 font-mono text-xs min-h-[160px] flex flex-col gap-2 relative overflow-hidden">
            <div className="text-zinc-600 border-b border-zinc-900 pb-2 flex justify-between">
              <span>CDrive Engine Telemetry Log</span>
              <span className="text-zinc-300 font-bold">STATE: {simStatus}</span>
            </div>
            {simLog.map((logLine, idx) => (
              <div key={idx} className="flex items-center gap-2 text-zinc-300 animate-fadeIn">
                <span className="text-zinc-500 font-bold">&gt;</span>
                <span>{logLine}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monochromatic Streamlined Feature Pillars */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto z-10 relative">
        <div className="text-center flex flex-col items-center gap-3 mb-16">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">[ ENGINE ARCHITECTURE ]</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">Built for zero latency.</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">Every component is engineered around AWS serverless primitives.</p>
        </div>

        {/* 4 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-8 rounded-3xl flex flex-col gap-4 group cursor-pointer" onClick={handleLaunch}>
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white font-sans group-hover:text-white transition-colors">Direct S3 Presigned PUTs</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Browser uploads binary objects directly to Amazon S3 using HMAC-SHA256 presigned URLs. Bypasses Lambda memory limits and API Gateway payload limits.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl flex flex-col gap-4 group cursor-pointer" onClick={handleLaunch}>
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white font-sans group-hover:text-white transition-colors">Single-Table Isolation</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Single-table Amazon DynamoDB design with strict `USER#&lt;ID&gt;` partition keys ensuring zero multi-tenant data leakage across accounts.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl flex flex-col gap-4 group cursor-pointer" onClick={handleLaunch}>
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white font-sans group-hover:text-white transition-colors">25-Day TTL Auto-Purge</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Trashed files automatically set DynamoDB `TTL = UnixTimestamp(now + 25 days)`. AWS background engines execute zero-cost automated purges.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl flex flex-col gap-4 group cursor-pointer" onClick={handleLaunch}>
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white font-sans group-hover:text-white transition-colors">AWS Intelligent-Tiering</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Automatic S3 lifecycle transitions move cold objects to cost-effective storage tiers with zero retrieval penalties.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Storage & Cost Meter Calculator */}
      <section id="calculator" className="py-16 px-6 max-w-4xl mx-auto z-10 relative">
        <div className="glass-card p-8 sm:p-10 rounded-3xl flex flex-col gap-8">
          <div className="flex flex-col items-center text-center gap-2">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">[ COST OPTIMIZATION ]</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">AWS Intelligent-Tiering Estimator</h3>
            <p className="text-xs text-zinc-400">Drag the slider to calculate your estimated monthly AWS S3 storage cost</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400">STORAGE VOLUME:</span>
              <span className={`font-bold transition-all duration-200 ${isSliding ? 'text-xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] scale-110' : 'text-lg text-zinc-200'}`}>
                {formattedVolume}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="5000"
              step="10"
              value={storageGb}
              onMouseDown={() => setIsSliding(true)}
              onMouseUp={() => setIsSliding(false)}
              onTouchStart={() => setIsSliding(true)}
              onTouchEnd={() => setIsSliding(false)}
              onChange={(e) => {
                setStorageGb(Number(e.target.value));
                if (!isSliding) {
                  setIsSliding(true);
                  setTimeout(() => setIsSliding(false), 800);
                }
              }}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-mono">
            <div className={`p-5 rounded-2xl bg-zinc-950/80 border transition-all duration-300 flex flex-col gap-1 ${isSliding ? 'border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-[1.03]' : 'border-zinc-800'}`}>
              <span className="text-[11px] text-zinc-400">CDrive S3 Intelligent-Tiering</span>
              <span className={`font-extrabold transition-all duration-300 ${isSliding ? 'text-4xl sm:text-5xl text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]' : 'text-2xl text-zinc-100'}`}>
                ${estimatedCost} <span className="text-xs text-zinc-500 font-normal">/ mo</span>
              </span>
              <span className="text-[10px] text-zinc-500">Auto-transitions to deep archive tiers</span>
            </div>
            <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 flex flex-col gap-1">
              <span className="text-[11px] text-zinc-400">Traditional Cloud Storage</span>
              <span className="text-2xl font-bold text-zinc-500 line-through">
                ${traditionalCost} / mo
              </span>
              <span className="text-[10px] text-zinc-500">Fixed rate pricing without tiering</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final Launch CTA */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center z-10 relative">
        <div className="glass-card p-12 sm:p-16 rounded-3xl flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">Initialize CDrive in seconds.</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md font-sans">
            Authenticate via Google OAuth 2.0 and manage your personal cloud storage with zero friction.
          </p>
          <button
            onClick={handleLaunch}
            className="btn-primary px-9 py-4 rounded-xl text-xs tracking-wider cursor-pointer flex items-center gap-3"
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
          <button onClick={handleLaunch} className="hover:text-white transition-colors cursor-pointer">[ LOGIN ]</button>
          <a href="https://github.com/anil-vinnakoti/CDrive" target="_blank" rel="noreferrer" className="hover:text-white transition-colors cursor-pointer">[ GITHUB ]</a>
        </div>
      </footer>
    </div>
  );
}
