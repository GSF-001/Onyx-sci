import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Search, Brain, BarChart2, Zap } from "lucide-react";

const STAT_FEATURES = [
  { icon: Search, label: "100M+", sub: "Research Papers" },
  { icon: Brain, label: "AI-Powered", sub: "Insights" },
  { icon: BarChart2, label: "Deep", sub: "Analytics" },
  { icon: Zap, label: "Faster", sub: "Discoveries" },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const dots: { x: number; y: number; z: number }[] = Array.from({ length: 280 }, () => ({
      x: Math.random() * W - W / 2,
      y: Math.random() * H - H / 2,
      z: Math.random() * W,
    }));

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.88)";
      ctx.fillRect(0, 0, W, H);
      for (const d of dots) {
        d.z -= 0.4;
        if (d.z <= 0) { d.x = Math.random() * W - W / 2; d.y = Math.random() * H - H / 2; d.z = W; }
        const x = W / 2 + (d.x / d.z) * W;
        const y = H / 2 + (d.y / d.z) * H;
        const s = Math.max(0.2, (1 - d.z / W) * 2);
        const a = 0.2 + (1 - d.z / W) * 0.8;
        ctx.fillStyle = `rgba(220,230,255,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(animId); };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/sign-up");
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden relative flex flex-col">
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-0 pointer-events-none" />

      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <img
            src="/onyx-logo-transparent.png"
            alt="ONYX"
            className="w-10 h-10 object-contain"
          />
          <div className="leading-none">
            <div className="font-black text-[17px] tracking-[0.12em] text-white">ONYX</div>
            <div className="font-medium text-[9px] tracking-[0.22em] text-neutral-400 -mt-0.5 uppercase">research</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/sign-in")}
            className="text-sm text-neutral-400 hover:text-white transition-colors px-4 py-2"
          >
            Sign In
          </button>
          <button
            onClick={() => setLocation("/sign-up")}
            className="text-sm bg-white text-black font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-100 transition-colors tracking-wide"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col max-w-5xl mx-auto px-6 pt-10 pb-16 w-full">
        {/* Badge */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-neutral-400 font-medium tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            AI-Powered Research Intelligence
          </span>
        </div>

        {/* Headline */}
        <div className="mb-8 max-w-2xl">
          <h1 className="text-[clamp(2.6rem,8vw,4.8rem)] font-black leading-[1.02] tracking-tight mb-2">
            <span className="text-neutral-400">Navigate the</span><br />
            <span className="text-neutral-400">World of</span><br />
            <span className="text-white">Research.</span>
          </h1>
          <h2 className="text-[clamp(1.5rem,4vw,2.4rem)] font-black leading-[1.05] tracking-tight text-neutral-500 mt-1">
            Discover<br />What Matters.
          </h2>
        </div>

        {/* Description */}
        <p className="text-neutral-400 text-base mb-10 max-w-md leading-relaxed">
          ONYX Research helps researchers discover, analyze, and synthesize
          scientific knowledge across 100M+ papers.
        </p>

        {/* Stat row */}
        <div className="grid grid-cols-4 gap-3 mb-10 max-w-2xl">
          {STAT_FEATURES.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/8 hover:border-white/20 transition-all"
            >
              <div className="w-10 h-10 bg-white/8 border border-white/10 rounded-xl flex items-center justify-center">
                <Icon className="w-4 h-4 text-neutral-300" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-white leading-tight">{label}</div>
                <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-3 max-w-2xl bg-white/5 border border-white/15 rounded-2xl px-5 py-3.5 focus-within:border-white/30 focus-within:bg-white/8 transition-all"
        >
          <Search className="w-4 h-4 text-neutral-500 flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-neutral-200 placeholder:text-neutral-600"
            placeholder="Search papers, concepts, methods, data..."
          />
          <button
            type="submit"
            className="flex items-center gap-2 bg-white text-black text-sm font-bold px-5 py-2 rounded-xl hover:bg-neutral-100 transition-colors flex-shrink-0 tracking-wide"
          >
            Start Research
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </main>

      {/* Bottom note */}
      <footer className="relative z-10 pb-6 text-center">
        <p className="text-neutral-700 text-xs">© 2026 ONYX Research · onyxresearch.ai</p>
      </footer>
    </div>
  );
}
