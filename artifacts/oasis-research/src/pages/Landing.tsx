import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Search, Sparkles, Network, Lightbulb, TrendingUp, Users, ArrowRight, ChevronRight, Menu, X } from "lucide-react";

const FEATURES = [
  { num: "01", icon: Search,     label: "Semantic Search",   desc: "Find any paper across 280M+ sources using natural language — no Boolean syntax, no keyword guessing.", accent: "from-blue-500 to-cyan-400",    glow: "rgba(59,130,246,0.3)" },
  { num: "02", icon: Sparkles,   label: "AI Copilot",        desc: "Ask questions grounded in real scientific literature. Get cited answers, not hallucinations.",          accent: "from-violet-500 to-purple-400", glow: "rgba(139,92,246,0.3)" },
  { num: "03", icon: Network,    label: "Knowledge Graph",   desc: "Visualize how concepts, methods, datasets and researchers connect — drag nodes, explore connections.",   accent: "from-emerald-500 to-teal-400",  glow: "rgba(16,185,129,0.3)" },
  { num: "04", icon: Lightbulb,  label: "Gap Discovery",     desc: "Identify white spaces in any research domain — the questions nobody has answered yet.",                  accent: "from-amber-500 to-yellow-400",  glow: "rgba(245,158,11,0.3)" },
  { num: "05", icon: TrendingUp, label: "Trend Analytics",   desc: "Track emerging topics before they peak. Stay ahead of the curve in your field.",                        accent: "from-orange-500 to-red-400",    glow: "rgba(249,115,22,0.3)" },
  { num: "06", icon: Users,      label: "Collaborate",       desc: "Connect with researchers working on adjacent problems. Build teams around shared interests.",            accent: "from-pink-500 to-rose-400",     glow: "rgba(236,72,153,0.3)" },
];

const STATS = [
  { val: "280M+", label: "Scientific Papers" },
  { val: "100+",  label: "Research Domains"  },
  { val: "<1s",   label: "Query Latency"     },
];

const NAV_LINKS = [
  { label: "Features", id: "features-section" },
  { label: "Pricing", id: "pricing-section" },
  { label: "About", id: "about-section" },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const dots = Array.from({ length: 420 }, () => ({
      x: Math.random() * W - W / 2,
      y: Math.random() * H - H / 2,
      z: Math.random() * W,
      hue: Math.random() > 0.75 ? 200 + Math.random() * 60 : 220,
    }));

    const blobs = [
      { x: 0.15, y: 0.25, r: 320, rgb: "20,10,80" },
      { x: 0.88, y: 0.55, r: 260, rgb: "10,25,90" },
      { x: 0.45, y: 0.90, r: 380, rgb: "50,10,70" },
    ];

    const drawStatic = () => {
      ctx.fillStyle = "#04040a";
      ctx.fillRect(0, 0, W, H);
      blobs.forEach((b) => {
        const gx = b.x * W, gy = b.y * H;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, b.r);
        g.addColorStop(0, `rgba(${b.rgb},0.09)`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(gx, gy, b.r, 0, Math.PI * 2);
        ctx.fill();
      });
      for (const d of dots) {
        const x = W / 2 + (d.x / d.z) * W;
        const y = H / 2 + (d.y / d.z) * H;
        const s = Math.max(0.15, (1 - d.z / W) * 2.6);
        const a = 0.2 + (1 - d.z / W) * 0.8;
        ctx.fillStyle = `hsla(${d.hue},55%,82%,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Respect reduced-motion: paint a single static frame instead of animating forever.
    if (prefersReducedMotion) {
      drawStatic();
      const onResize = () => {
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = W; canvas.height = H;
        drawStatic();
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const draw = () => {
      ctx.fillStyle = "#04040a";
      ctx.fillRect(0, 0, W, H);

      blobs.forEach((b) => {
        const gx = b.x * W, gy = b.y * H;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, b.r);
        g.addColorStop(0, `rgba(${b.rgb},0.09)`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(gx, gy, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      for (const d of dots) {
        d.z -= 0.38;
        if (d.z <= 0) {
          d.x = Math.random() * W - W / 2;
          d.y = Math.random() * H - H / 2;
          d.z = W;
        }
        const x = W / 2 + (d.x / d.z) * W;
        const y = H / 2 + (d.y / d.z) * H;
        const s = Math.max(0.15, (1 - d.z / W) * 2.6);
        const a = 0.2 + (1 - d.z / W) * 0.8;
        ctx.fillStyle = `hsla(${d.hue},55%,82%,${a})`;
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

  const af = FEATURES[activeFeature];

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#04040a] text-white font-sans overflow-x-hidden relative">
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />

      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 90% 60% at 50% -5%, transparent 0%, rgba(4,4,10,0.55) 65%, #04040a 100%)" }} />

      {/* ── Nav ── */}
      <header className="relative z-30 flex items-center justify-between px-6 md:px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img src="/Onyx-logo.png" alt="Onyx" className="w-11 h-11 object-contain" />
          <div className="leading-none">
            <div className="font-black text-[17px] tracking-[0.12em] text-white">ONYX</div>
            <div className="font-medium text-[9px] tracking-[0.22em] text-neutral-600 -mt-0.5">RESEARCH</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <button
              key={l.label}
              onClick={() => scrollToSection(l.id)}
              className="text-sm text-neutral-500 hover:text-white transition-colors"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => setLocation("/sign-in")}
            className="text-sm text-neutral-500 hover:text-white transition-colors px-4 py-2">
            Sign in
          </button>
          <button onClick={() => setLocation("/sign-up")}
            className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.14) 0%,rgba(255,255,255,0.05) 100%)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 0 24px rgba(100,120,255,0.15)" }}>
            Start Free →
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileNavOpen}
          className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </header>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="md:hidden relative z-30 mx-6 mb-4 rounded-2xl p-5"
          style={{ background: "rgba(10,10,16,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <nav className="flex flex-col gap-1 mb-4">
            {NAV_LINKS.map((l) => (
              <button
                key={l.label}
                onClick={() => scrollToSection(l.id)}
                className="text-left text-sm text-neutral-400 hover:text-white transition-colors py-2.5"
              >
                {l.label}
              </button>
            ))}
          </nav>
          <div className="flex flex-col gap-2 pt-3 border-t border-white/8">
            <button onClick={() => setLocation("/sign-in")}
              className="text-sm text-neutral-400 hover:text-white transition-colors py-2 text-left">
              Sign in
            </button>
            <button onClick={() => setLocation("/sign-up")}
              className="text-sm font-semibold px-5 py-3 rounded-xl text-center"
              style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.14) 0%,rgba(255,255,255,0.05) 100%)", border: "1px solid rgba(255,255,255,0.18)" }}>
              Start Free →
            </button>
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">

        {/* ── Badge ── */}
        <div className="flex justify-center pt-10 md:pt-14 mb-10">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-[11px] font-medium tracking-[0.2em] text-neutral-500"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(8px)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
            AI-POWERED RESEARCH INTELLIGENCE
          </div>
        </div>

        {/* ── Hero headline ── */}
        <div className="text-center mb-10 max-w-5xl mx-auto">
          <h1 className="leading-[1.03] mb-7" style={{ fontWeight: 900 }}>
            <span className="block" style={{
              fontSize: "clamp(2.6rem,9vw,7.5rem)",
              letterSpacing: "-0.035em",
              background: "linear-gradient(175deg,#fff 0%,rgba(255,255,255,0.65) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Navigate the World
            </span>
            <span className="block" style={{
              fontSize: "clamp(2.6rem,9vw,7.5rem)",
              letterSpacing: "-0.035em",
              background: "linear-gradient(175deg,#fff 20%,rgba(255,255,255,0.55) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              of Research.
            </span>
            <span className="block mt-3" style={{
              fontSize: "clamp(1.6rem,5.5vw,4.8rem)",
              letterSpacing: "-0.025em",
              background: "linear-gradient(160deg,rgba(150,165,255,0.95) 0%,rgba(100,120,200,0.45) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Discover What Matters.
            </span>
          </h1>
          <p className="text-neutral-500 text-base md:text-lg leading-relaxed max-w-[480px] mx-auto">
            Synthesize 280M+ papers into clear answers, connected concepts, and unexplored opportunities.
          </p>
        </div>

        {/* ── CTA ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20 md:mb-28">
          <button onClick={() => setLocation("/sign-up")}
            className="group flex items-center gap-2.5 font-semibold px-9 py-4 rounded-2xl text-sm transition-all hover:brightness-105 w-full sm:w-auto justify-center"
            style={{ background: "linear-gradient(135deg,#ffffff 0%,#e6eaff 100%)", color: "#07071a", boxShadow: "0 0 50px rgba(120,140,255,0.22),0 6px 28px rgba(0,0,0,0.45)" }}>
            Start Research
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button onClick={() => setLocation("/sign-in")}
            className="flex items-center gap-2 text-sm font-medium px-9 py-4 rounded-2xl text-neutral-500 hover:text-white transition-all w-full sm:w-auto justify-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(8px)" }}>
            Already have an account <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="flex items-center justify-center gap-10 md:gap-20 mb-24 md:mb-36 flex-wrap">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-black tracking-tight" style={{
                fontSize: "clamp(2rem,5vw,3.8rem)",
                background: "linear-gradient(175deg,#fff 0%,rgba(255,255,255,0.45) 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>{s.val}</div>
              <div className="text-[11px] text-neutral-600 tracking-[0.22em] uppercase mt-1.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Features ── */}
        <div id="features-section" className="max-w-6xl mx-auto mb-24 md:mb-36 scroll-mt-24">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-[11px] text-neutral-700 tracking-[0.28em] uppercase font-medium mb-3">Everything You Need</p>
            <h2 className="font-black tracking-tight" style={{
              fontSize: "clamp(1.8rem,4vw,3rem)",
              background: "linear-gradient(175deg,#fff 0%,rgba(255,255,255,0.65) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              One Platform. Every Tool.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center">
            <div>
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                const active = activeFeature === i;
                return (
                  <button key={f.num}
                    onMouseEnter={() => setActiveFeature(i)}
                    onClick={() => setActiveFeature(i)}
                    className="w-full text-left flex items-start gap-5 px-4 md:px-6 py-6 transition-all border-b border-white/[0.04] last:border-0 group"
                    style={active ? { background: "rgba(255,255,255,0.035)", backdropFilter: "blur(16px)" } : {}}>
                    <div className="text-[11px] font-bold text-neutral-800 mt-1 tracking-widest w-6 flex-shrink-0">{f.num}</div>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${f.accent} transition-opacity`}
                      style={{ opacity: active ? 1 : 0.35 }}>
                      <Icon size={17} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm mb-0.5 transition-colors ${active ? "text-white" : "text-neutral-600 group-hover:text-neutral-400"}`}>
                        {f.label}
                      </div>
                      <div className={`text-xs leading-relaxed transition-colors ${active ? "text-neutral-400" : "text-neutral-700"}`}>
                        {f.desc}
                      </div>
                    </div>
                    {/* Mobile-only preview, since the glass panel is hidden below md */}
                    {active && (
                      <div className="md:hidden flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: f.glow }}>
                        <Icon size={16} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Glass preview panel — desktop only */}
            <div className="hidden md:flex items-center justify-center pl-14">
              <div className="w-full h-80 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg,rgba(255,255,255,0.055) 0%,rgba(255,255,255,0.018) 100%)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: `0 0 80px ${af.glow} inset, 0 24px 64px rgba(0,0,0,0.45)`,
                  transition: "box-shadow 0.4s ease",
                }}>
                <div className={`absolute inset-0 bg-gradient-to-br ${af.accent} opacity-[0.07] blur-3xl transition-all duration-500`} />
                <div className={`w-24 h-24 rounded-[28px] bg-gradient-to-br ${af.accent} flex items-center justify-center mb-6 relative`}
                  style={{ boxShadow: `0 0 48px ${af.glow}`, transition: "all 0.3s ease" }}>
                  {React.createElement(af.icon, { size: 42, className: "text-white" })}
                </div>
                <div className="font-black text-2xl text-white mb-2 relative tracking-tight">{af.label}</div>
                <div className="text-sm text-neutral-500 max-w-[260px] text-center leading-relaxed relative">{af.desc}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Final CTA ── */}
        <div id="pricing-section" className="text-center pb-16 scroll-mt-24">
          <div className="inline-block rounded-3xl px-8 md:px-14 py-12 md:py-14 relative overflow-hidden w-full md:w-auto"
            style={{
              background: "linear-gradient(135deg,rgba(255,255,255,0.045) 0%,rgba(255,255,255,0.015) 100%)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.065)",
              boxShadow: "0 0 100px rgba(60,80,200,0.08) inset, 0 0 60px rgba(80,100,240,0.05)",
            }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.04] to-violet-600/[0.04] pointer-events-none" />
            <h2 className="font-black tracking-tight mb-2 relative" style={{
              fontSize: "clamp(1.6rem,3vw,2.4rem)",
              background: "linear-gradient(175deg,#fff 0%,rgba(255,255,255,0.65) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Ready to Navigate Science?
            </h2>
            <p className="text-neutral-600 text-sm mb-8 relative">Free forever. No credit card required.</p>
            <button onClick={() => setLocation("/sign-up")}
              className="group flex items-center gap-2.5 font-semibold px-10 py-4 rounded-2xl text-sm mx-auto relative hover:brightness-105 transition-all"
              style={{ background: "linear-gradient(135deg,#ffffff 0%,#e6eaff 100%)", color: "#07071a", boxShadow: "0 0 40px rgba(120,140,255,0.2),0 6px 24px rgba(0,0,0,0.55)" }}>
              Get Started Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        <div id="about-section" className="text-center pb-24 scroll-mt-24">
          <p className="text-neutral-600 text-sm max-w-md mx-auto leading-relaxed mb-6">
            Onyx Research is built for people who read papers for a living — indexing 280M+ sources
            so a literature review takes minutes, not weeks.
          </p>
          <p className="text-neutral-800 text-xs">© 2025 Onyx Research · All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
