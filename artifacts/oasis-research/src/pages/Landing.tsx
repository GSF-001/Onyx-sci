import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Search, Sparkles, Network, Lightbulb, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Starfield animation
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const stars: { x: number; y: number; z: number; size: number }[] = [];
    const numStars = 400;

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * width,
        size: Math.random() * 1.5,
      });
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.z -= 0.5;

        if (star.z <= 0) {
          star.x = Math.random() * width - cx;
          star.y = Math.random() * height - cy;
          star.z = width;
        }

        const x = cx + (star.x / star.z) * width;
        const y = cy + (star.y / star.z) * width;
        const s = (1 - star.z / width) * 3;

        ctx.fillStyle = "white";
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
    { icon: Search, label: "Semantic Search", href: "/search" },
    { icon: Sparkles, label: "AI Copilot", href: "/copilot" },
    { icon: Network, label: "Knowledge Graph", href: "/graph" },
    { icon: Lightbulb, label: "Gap Discovery", href: "/gaps" },
    { icon: TrendingUp, label: "Novelty Trends", href: "/trends" },
    { icon: Users, label: "Collaborate", href: "/collaborate" },
  ];

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-hidden relative flex flex-col font-sans">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/80 to-black z-0 pointer-events-none" />
      
      {/* Top Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
          </div>
          <span className="font-bold tracking-widest text-sm">OASIS RESEARCH</span>
        </div>
        <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setLocation("/search")}>
          Launch App
        </Button>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        <div className="inline-flex items-center space-x-2 bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-full px-4 py-1.5 mb-8">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-sm font-medium tracking-wide text-neutral-300">AI-Powered Research Intelligence</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-[1.1] font-medium text-center">
          Navigate the World of Research.<br />
          <span className="text-neutral-500">Discover What Matters.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-neutral-400 mb-12 max-w-2xl text-center">
          The operating system for modern research. Navigate 100M+ papers, discover gaps, and stay ahead of emerging science.
        </p>
        
        <div className="w-full max-w-2xl bg-neutral-900/60 backdrop-blur-md border border-neutral-700 rounded-2xl p-2 flex shadow-2xl">
          <div className="pl-4 flex items-center justify-center text-neutral-400">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            placeholder="Search papers, concepts, or ask a question..." 
            className="flex-1 bg-transparent border-none text-white px-4 py-4 outline-none placeholder:text-neutral-500 text-lg"
          />
          <Button onClick={() => setLocation("/search")} size="lg" className="bg-white text-black hover:bg-neutral-200 rounded-xl px-8 h-auto font-medium">
            Start Research
          </Button>
        </div>

        <div className="mt-20 w-full max-w-5xl">
          <p className="text-center text-sm text-neutral-500 font-medium tracking-widest uppercase mb-8">Powerful Tools for Breakthrough Research</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div key={i} onClick={() => setLocation(mod.href)} className="flex flex-col items-center p-6 bg-neutral-900/40 border border-neutral-800 rounded-2xl hover:bg-neutral-800 transition-colors cursor-pointer group">
                  <Icon className="w-8 h-8 mb-4 text-neutral-400 group-hover:text-white transition-colors" />
                  <span className="text-sm font-medium text-center">{mod.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer / Logos */}
      <footer className="relative z-10 py-12 border-t border-neutral-900 bg-black/50">
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center">
          <p className="text-sm text-neutral-600 mb-8 uppercase tracking-widest">Trusted by researchers at</p>
          <div className="flex flex-wrap justify-center gap-12 items-center opacity-50 grayscale">
            <span className="text-xl font-bold font-serif">MIT</span>
            <span className="text-xl font-bold font-serif">Stanford</span>
            <span className="text-xl font-bold font-serif">Harvard</span>
            <span className="text-xl font-bold font-sans">Google DeepMind</span>
            <span className="text-xl font-bold font-sans">NASA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}