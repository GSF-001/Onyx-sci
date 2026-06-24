import React from "react";
import { useLocation } from "wouter";
import {
  Search,
  Sparkles,
  Network,
  Lightbulb,
  TrendingUp,
  Users,
  ArrowRight,
  Menu,
  Bell,
} from "lucide-react";
import OasisLogo from "../components/OasisLogo";

const modules = [
  {
    icon: Search,
    label: "Semantic Search",
    href: "/search",
    description: "Find the most relevant papers using natural language and semantic understanding.",
    preview: (
      <div className="bg-neutral-900 rounded-xl p-3 text-white text-xs font-mono">
        <div className="flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2 mb-2">
          <Search className="w-3 h-3 text-neutral-400 flex-shrink-0" />
          <span className="text-neutral-300 truncate">protein folding with deep learning</span>
        </div>
        <div className="text-neutral-500 text-[10px]">12,458 results found</div>
      </div>
    ),
  },
  {
    icon: Sparkles,
    label: "AI Copilot",
    href: "/copilot",
    description: "Get AI-powered summaries, synthesis, and answers with real citations from the literature.",
    preview: (
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs space-y-2">
        <div className="bg-purple-100 rounded-lg px-3 py-1.5 text-purple-800 text-right text-[11px]">
          What are emerging approaches in protein folding?
        </div>
        <div className="text-neutral-600 text-[11px] leading-relaxed">
          Based on 24 papers, here are the key advances...
        </div>
      </div>
    ),
  },
  {
    icon: Network,
    label: "Knowledge Graph",
    href: "/graph",
    description: "Explore connections between concepts, methods, datasets, researchers, and publications.",
    preview: (
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs relative h-20 overflow-hidden">
        {[
          { label: "AlphaFold", x: "55%", y: "15%" },
          { label: "Diffusion\nModels", x: "5%", y: "50%" },
          { label: "Structure\nPrediction", x: "60%", y: "55%" },
          { label: "Structure", x: "70%", y: "80%" },
        ].map((n) => (
          <div
            key={n.label}
            className="absolute bg-white border border-neutral-300 rounded-md px-1.5 py-0.5 text-[9px] font-medium text-neutral-700 whitespace-pre-line leading-tight shadow-sm"
            style={{ left: n.x, top: n.y }}
          >
            {n.label}
          </div>
        ))}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          <line x1="30%" y1="25%" x2="58%" y2="25%" stroke="#d1d5db" strokeWidth="1" />
          <line x1="30%" y1="55%" x2="60%" y2="55%" stroke="#d1d5db" strokeWidth="1" />
        </svg>
      </div>
    ),
  },
  {
    icon: Lightbulb,
    label: "Research Gap Discovery",
    href: "/gaps",
    description: "Identify high-impact research gaps and unexplored opportunities before they go mainstream.",
    preview: (
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs">
        <div className="text-[9px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5">Top Opportunity</div>
        <div className="font-semibold text-neutral-900 text-[11px] mb-2">Neuro-symbolic Protein Folding</div>
        <div className="flex gap-3 text-[10px]">
          <span className="text-neutral-500">Impact <span className="font-bold text-neutral-800">9.5/10</span></span>
          <span className="text-neutral-500">Competition <span className="font-bold text-green-600">Low</span></span>
          <span className="text-neutral-500">Difficulty <span className="font-bold text-amber-600">Medium</span></span>
        </div>
      </div>
    ),
  },
  {
    icon: TrendingUp,
    label: "Novelty & Trend Analysis",
    href: "/trends",
    description: "Track emerging trends and measure novelty across research areas with AI-powered scoring.",
    preview: (
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs h-20 flex items-end gap-1">
        {[30, 38, 45, 52, 48, 62, 75, 82, 90].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h}%`,
              background: `hsl(${220 + i * 5}, 70%, ${50 + i * 3}%)`,
              opacity: 0.7 + i * 0.03,
            }}
          />
        ))}
      </div>
    ),
  },
  {
    icon: Users,
    label: "Collaborate",
    href: "/collaborate",
    description: "Share collections, annotate papers, and collaborate seamlessly with your team.",
    preview: (
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">T</div>
          <span className="text-neutral-600">Team Workspace</span>
          <span className="ml-auto text-neutral-400">12 members</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">S</div>
          <span className="text-neutral-600">Shared Collections</span>
          <span className="ml-auto text-neutral-400">8 collections</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">P</div>
          <span className="text-neutral-600">Projects</span>
          <span className="ml-auto text-neutral-400">24 papers</span>
        </div>
      </div>
    ),
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-100 px-5 py-4 flex items-center justify-between">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2.5">
          <OasisLogo size={28} color="#111" />
          <div className="leading-none">
            <div className="font-bold tracking-[0.18em] text-xs text-neutral-900">OASIS</div>
            <div className="text-[8px] tracking-[0.22em] text-neutral-400 font-medium">RESEARCH</div>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <button className="text-neutral-400 hover:text-neutral-700 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="text-neutral-400 hover:text-neutral-700 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="px-5 pt-8 pb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 leading-tight mb-2">
          Powerful Tools for<br />Breakthrough Research
        </h1>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Everything you need to discover, analyze, and stay ahead.
        </p>
      </div>

      {/* Module tabs */}
      <div className="border-b border-neutral-100 sticky top-[65px] bg-white z-20">
        <div className="flex overflow-x-auto px-3 gap-1 scrollbar-hide">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.href}
                onClick={() => setActiveTab(i)}
                className={`flex flex-col items-center gap-1.5 px-4 py-3 min-w-[72px] transition-all border-b-2 flex-shrink-0 ${
                  activeTab === i
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-neutral-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium text-center leading-tight whitespace-pre-line">
                  {mod.label.replace(" ", "\n")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Module list */}
      <div className="divide-y divide-neutral-100">
        {modules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.href}
              className={`px-5 py-6 transition-colors ${activeTab === i ? "bg-neutral-50" : "bg-white"}`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-neutral-700" />
                    <h2 className="font-semibold text-neutral-900 text-base">{mod.label}</h2>
                  </div>
                  <p className="text-neutral-500 text-sm leading-relaxed mb-4">{mod.description}</p>
                  <button
                    onClick={() => setLocation(mod.href)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900 hover:text-neutral-600 transition-colors group"
                  >
                    Learn more
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
                <div className="w-44 flex-shrink-0">{mod.preview}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="bg-neutral-950 text-white px-5 py-10 text-center">
        <h3 className="font-bold text-lg mb-2">Ready to start researching?</h3>
        <p className="text-neutral-400 text-sm mb-6">Pick any module above to begin.</p>
        <button
          onClick={() => setLocation("/search")}
          className="bg-white text-black font-semibold text-sm px-8 py-3.5 rounded-2xl hover:bg-neutral-100 transition-colors inline-flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Start Searching
        </button>
      </div>
    </div>
  );
}
