import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Search, Sparkles, Network, Lightbulb, TrendingUp, Users, Menu, X, ArrowRight } from "lucide-react";
import OasisLogo from "../components/OasisLogo";

export default function Landing() {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const stars: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < 350; i++) {
      stars.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * width,
      });
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.82)";
      ctx.fillRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      for (const star of stars) {
        star.z -= 0.45;
        if (star.z <= 0) {
          star.x = Math.random() * width - cx;
          star.y = Math.random() * height - cy;
          star.z = width;
        }
        const x = cx + (star.x / star.z) * width;
        const y = cy + (star.y / star.z) * width;
        const s = Math.max(0.2, (1 - star.z / width) * 2.5);
        ctx.fillStyle = `rgba(255,255,255,${0.4 + (1 - star.z / width) * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const modules = [
    { icon: Search, label: "Semantic\nSearch", href: "/search" },
    { icon: Sparkles, label: "AI\nCopilot", href: "/copilot" },
    { icon: Network, label: "Knowledge\nGraph", href: "/graph" },
    { icon: Lightbulb, label: "Gap\nDiscovery", href: "/gaps" },
    { icon: TrendingUp, label: "Novelty\nTrends", href: "/trends" },
    { icon: Users, label: "Collaborate", href: "/collaborate" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/home");
  };

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-x-hidden relative flex flex-col font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70 z-0 pointer-events-none" />

      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <OasisLogo size={36} color="white" />
          <div className="leading-none">
            <div className="font-bold tracking-[0.2em] text-sm">OASIS</div>
            <div className="text-[10px] tracking-[0.25em] text-neutral-400 font-medium">RESEARCH</div>
          </div>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-white hover:text-neutral-300 transition-colors"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        {menuOpen && (
          <div className="absolute top-16 right-4 w-56 bg-neutral-900/95 backdrop-blur border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl z-50">
            {modules.map((m) => (
              <button
                key={m.href}
                onClick={() => { setLocation(m.href); setMenuOpen(false); }}
                className="w-full text-left px-5 py-3 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
              >
                {m.label.replace("\n", " ")}
              </button>
            ))}
            <div className="border-t border-neutral-800 mt-1" />
            <button
              onClick={() => { setLocation("/home"); setMenuOpen(false); }}
              className="w-full text-left px-5 py-3 text-sm text-blue-400 hover:bg-neutral-800 transition-colors font-medium"
            >
              Launch App →
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col px-6 pt-12 pb-8">
        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur border border-white/10 rounded-full px-4 py-1.5 mb-8 self-start">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-medium tracking-wider text-neutral-300">AI-Powered Research Intelligence</span>
        </div>

        <h1 className="text-[clamp(2.4rem,8vw,5.5rem)] font-serif font-medium leading-[1.05] mb-4 max-w-5xl">
          Navigate the<br />
          World of Research.<br />
          <span className="text-neutral-500">Discover What Matters.</span>
        </h1>

        <p className="text-neutral-400 text-base md:text-lg mb-3 max-w-lg leading-relaxed">
          OASIS Research helps researchers discover, analyze, and synthesize scientific knowledge across 100M+ papers.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mt-6 w-full max-w-xl flex items-center bg-white/8 backdrop-blur border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
          <Search className="ml-5 w-5 h-5 text-neutral-400 flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search 100M+ papers, concepts, methods, datasets..."
            className="flex-1 bg-transparent px-4 py-4 text-white placeholder:text-neutral-500 text-sm outline-none"
          />
          <button
            type="submit"
            className="m-1.5 bg-white text-black font-semibold text-sm px-5 py-3 rounded-xl hover:bg-neutral-100 transition-colors flex items-center gap-2 flex-shrink-0"
          >
            Start Research <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Module icons */}
        <div className="mt-16 grid grid-cols-3 md:grid-cols-6 gap-3 max-w-2xl">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.href}
                onClick={() => setLocation(mod.href)}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/25 transition-all group"
              >
                <Icon className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
                <span className="text-[11px] text-neutral-400 group-hover:text-white font-medium text-center leading-tight whitespace-pre-line transition-colors">
                  {mod.label}
                </span>
              </button>
            );
          })}
        </div>
      </main>

      {/* Trusted by */}
      <section className="relative z-10 border-t border-white/5 py-10 px-6 bg-black/40">
        <p className="text-center text-xs text-neutral-600 uppercase tracking-widest mb-6 font-medium">
          Trusted by leading institutions
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-14 items-center opacity-40">
          {["MIT", "Stanford", "Harvard", "Google DeepMind", "NASA"].map((name) => (
            <span key={name} className="text-white font-bold text-sm md:text-base tracking-wide">{name}</span>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 bg-black py-16 px-6 text-center">
        <h2 className="text-2xl md:text-4xl font-serif font-medium mb-4">
          Find the Next Breakthrough<br />Before Everyone Else
        </h2>
        <p className="text-neutral-400 mb-8 text-sm md:text-base max-w-md mx-auto">
          Join thousands of researchers already accelerating their discoveries with OASIS.
        </p>
        <button
          onClick={() => setLocation("/home")}
          className="inline-flex items-center gap-2 bg-white text-black font-semibold px-8 py-4 rounded-2xl hover:bg-neutral-100 transition-colors text-sm"
        >
          Get Started for Free <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-neutral-600 text-xs mt-4">No credit card required</p>
        <p className="text-neutral-700 text-xs mt-6">oasisresearch.ai</p>
      </section>
    </div>
  );
}
