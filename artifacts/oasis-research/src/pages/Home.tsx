import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Search,
  Sparkles,
  Network,
  Lightbulb,
  TrendingUp,
  Users,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Bookmark,
  Quote,
  X,
  Loader2,
  FileText,
  SearchX,
} from "lucide-react";

interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  abstract: string;
  journal: string | null;
  citationCount: number;
  isOpenAccess: boolean;
  url: string;
  pdfUrl: string | null;
}

const TRENDING = [
  "protein folding",
  "CRISPR cancer",
  "large language models",
  "single-cell RNA",
  "renewable energy",
  "quantum computing",
];

const modules = [
  {
    icon: Search,
    label: "Semantic Search",
    href: "/search",
    accentColor: "text-sky-400",
    bgColor: "bg-sky-400/8",
    borderColor: "border-sky-400/15",
    glow: "shadow-sky-500/10",
    description: "Find the most relevant papers using natural language and semantic understanding.",
  },
  {
    icon: Sparkles,
    label: "AI Copilot",
    href: "/copilot",
    accentColor: "text-violet-400",
    bgColor: "bg-violet-400/8",
    borderColor: "border-violet-400/15",
    glow: "shadow-violet-500/10",
    description: "Get AI-generated summaries, synthesis, and answers with real citations from literature.",
  },
  {
    icon: Network,
    label: "Knowledge Graph",
    href: "/graph",
    accentColor: "text-emerald-400",
    bgColor: "bg-emerald-400/8",
    borderColor: "border-emerald-400/15",
    glow: "shadow-emerald-500/10",
    description: "Visualize relationships between papers, authors, concepts, and research fields.",
  },
  {
    icon: Lightbulb,
    label: "Gap Discovery",
    href: "/gaps",
    accentColor: "text-amber-400",
    bgColor: "bg-amber-400/8",
    borderColor: "border-amber-400/15",
    glow: "shadow-amber-500/10",
    description: "Identify underexplored research areas and discover breakthrough opportunities.",
  },
  {
    icon: TrendingUp,
    label: "Novelty Trends",
    href: "/trends",
    accentColor: "text-orange-400",
    bgColor: "bg-orange-400/8",
    borderColor: "border-orange-400/15",
    glow: "shadow-orange-500/10",
    description: "Track rising topics and predict the direction of future research.",
  },
  {
    icon: Users,
    label: "Collaborate",
    href: "/collaborate",
    accentColor: "text-pink-400",
    bgColor: "bg-pink-400/8",
    borderColor: "border-pink-400/15",
    glow: "shadow-pink-500/10",
    description: "Connect with researchers in the same field and manage research projects.",
  },
];

// Apple-style "easeOutExpo"-ish easing used across the page
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function Home() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [results, setResults] = useState<Paper[]>([]);
  const [total, setTotal] = useState(0);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const doSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    // Cancel any in-flight request so a stale response can never clobber a newer one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResults([]);
    setAiSummary(null);
    setSubmitted(trimmed);
    setSearched(true);
    try {
      const res = await fetch(`${BASE}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, limit: 10 }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.papers ?? []);
      setTotal(data.total ?? 0);
      setAiSummary(data.aiSummary ?? null);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError("Search failed. Please try again.");
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const clearSearch = () => {
    abortRef.current?.abort();
    setQuery("");
    setResults([]);
    setSubmitted("");
    setAiSummary(null);
    setError(null);
    setSearched(false);
    setLoading(false);
    inputRef.current?.focus();
  };

  const goToFullSearch = () => {
    const params = submitted ? `?q=${encodeURIComponent(submitted)}` : "";
    setLocation(`/search${params}`);
  };

  const toggleSaved = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasResults = results.length > 0;
  const noResults = searched && !loading && !error && results.length === 0;

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 font-sans relative overflow-x-hidden [font-feature-settings:'ss01','cv01'] [-webkit-font-smoothing:antialiased]">
      <style>{`
        @keyframes onyx-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(2%, -3%) scale(1.05); }
        }
        @keyframes onyx-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes onyx-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes onyx-shimmer {
          from { background-position: -200% 0; }
          to { background-position: 200% 0; }
        }
        @keyframes onyx-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        .onyx-appear {
          animation: onyx-fade-up 0.6s ${EASE} both;
        }
        .onyx-fade {
          animation: onyx-fade-in 0.5s ${EASE} both;
        }
        .onyx-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 37%, rgba(255,255,255,0.03) 63%);
          background-size: 400% 100%;
          animation: onyx-shimmer 1.6s ease-in-out infinite;
        }
        .onyx-pop {
          animation: onyx-pop 0.35s ${EASE};
        }
        @media (prefers-reduced-motion: reduce) {
          .onyx-appear, .onyx-fade, .onyx-shimmer, .onyx-pop, .onyx-orb { animation: none !important; }
        }
      `}</style>

      {/* Ambient glow — sits behind the hero, very restrained */}
      <div
        className="onyx-orb pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full opacity-[0.15] blur-[110px]"
        style={{
          background: "radial-gradient(circle, #38bdf8 0%, #8b5cf6 45%, transparent 70%)",
          animation: "onyx-drift 14s ease-in-out infinite",
        }}
      />

      {/* Hero + Search */}
      <div className="relative px-4 pt-8 pb-6 max-w-2xl mx-auto">
        {/* Logo + Name */}
        <div className="flex items-center gap-3 mb-6 onyx-appear">
          <img src={`${BASE}/onyx-logo-transparent.png`} alt="ONYX" className="w-8 h-8 object-contain" />
          <div className="leading-none">
            <div className="font-black text-base tracking-[0.12em] text-white">ONYX</div>
            <div className="font-medium text-[9px] tracking-[0.2em] text-neutral-500 -mt-0.5 uppercase">research</div>
          </div>
        </div>

        <h1
          className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight tracking-tight onyx-appear"
          style={{ animationDelay: "60ms" }}
        >
          Advanced Tools for<br />Breakthrough Research
        </h1>
        <p className="text-neutral-500 text-sm mb-5 leading-relaxed onyx-appear" style={{ animationDelay: "120ms" }}>
          Search millions of papers, understand key findings,<br className="hidden md:block" />
          and discover research gaps with AI.
        </p>

        {/* Search box */}
        <form onSubmit={handleSubmit} className="onyx-appear" style={{ animationDelay: "180ms" }}>
          <div
            className="flex items-center rounded-2xl px-4 py-3 transition-all bg-white/4 shadow-sm"
            style={{
              border: focused ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.1)",
              boxShadow: focused ? "0 0 0 4px rgba(56,189,248,0.08)" : "none",
              transitionTimingFunction: EASE,
              transitionDuration: "250ms",
            }}
          >
            <Search className="w-4 h-4 text-neutral-600 flex-shrink-0 mr-3" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="flex-1 bg-transparent text-sm outline-none text-neutral-100 placeholder:text-neutral-600"
              placeholder="Search papers, concepts, methods, researchers..."
              aria-label="Search papers, concepts, methods, researchers"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="text-neutral-600 hover:text-neutral-300 mx-1 transition-colors active:scale-90"
                style={{ transitionTimingFunction: EASE }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="ml-2 px-4 py-1.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-neutral-100 disabled:opacity-30 transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-[0.96]"
              style={{ transitionTimingFunction: EASE, transitionDuration: "150ms" }}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
            </button>
          </div>
        </form>

        {/* Trending suggestions */}
        {!hasResults && !loading && !searched && (
          <div className="mt-4 onyx-appear" style={{ animationDelay: "240ms" }}>
            <p className="text-xs text-neutral-600 mb-2">Try popular searches</p>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((t) => (
                <button
                  key={t}
                  onClick={() => { setQuery(t); doSearch(t); }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-white/8 rounded-full text-neutral-500 hover:border-white/20 hover:text-neutral-200 hover:bg-white/4 transition-all active:scale-95"
                  style={{ transitionTimingFunction: EASE }}
                >
                  <Search className="w-3 h-3 text-neutral-600" />
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-2xl mx-auto px-4 mb-4 onyx-appear">
          <div className="text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="max-w-2xl mx-auto px-4 space-y-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-white/6 rounded-2xl p-4 onyx-fade"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex gap-3">
                <div className="w-9 h-9 onyx-shimmer rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 onyx-shimmer rounded w-3/4" />
                  <div className="h-3 onyx-shimmer rounded w-1/3" />
                  <div className="h-3 onyx-shimmer rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {noResults && (
        <div className="max-w-2xl mx-auto px-4 pb-10 onyx-appear">
          <div className="flex flex-col items-center text-center border border-white/6 rounded-2xl px-6 py-10">
            <div className="w-11 h-11 rounded-2xl bg-white/6 flex items-center justify-center mb-4">
              <SearchX className="w-5 h-5 text-neutral-500" />
            </div>
            <p className="text-sm font-semibold text-neutral-200 mb-1">
              No results for "{submitted}"
            </p>
            <p className="text-xs text-neutral-600 max-w-xs leading-relaxed">
              Try a broader term, check for typos, or search by author or concept instead.
            </p>
          </div>
        </div>
      )}

      {/* Search Results */}
      {hasResults && !loading && (
        <div className="max-w-2xl mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-3 onyx-appear">
            <p className="text-sm text-neutral-500">
              Results for: <span className="font-semibold text-neutral-200">"{submitted}"</span>
              <span className="text-neutral-600 ml-2 text-xs">{total.toLocaleString()} found</span>
            </p>
            <button
              onClick={goToFullSearch}
              className="text-xs text-neutral-500 border border-white/8 rounded-lg px-2.5 py-1 hover:border-white/20 hover:text-neutral-200 transition-all flex items-center gap-1 active:scale-95"
              style={{ transitionTimingFunction: EASE }}
            >
              Filter <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {aiSummary && (
            <div
              className="mb-4 px-4 py-3 bg-sky-500/6 border border-sky-500/15 rounded-xl text-sm text-neutral-300 leading-relaxed onyx-appear"
              style={{ animationDelay: "40ms" }}
            >
              <span className="font-semibold text-sky-400 mr-1.5">AI Summary</span>
              {aiSummary}
            </div>
          )}

          <div className="space-y-3">
            {results.map((paper, i) => {
              const isSaved = savedIds.has(paper.id);
              return (
                <article
                  key={paper.id}
                  className="flex gap-3 border border-white/6 rounded-2xl p-4 hover:border-white/12 hover:bg-white/2 transition-all group onyx-appear"
                  style={{ animationDelay: `${Math.min(i, 6) * 45}ms`, transitionTimingFunction: EASE }}
                >
                  <div className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-neutral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-semibold text-neutral-200 group-hover:text-sky-400 transition-colors leading-snug mb-0.5"
                    >
                      {paper.title}
                    </a>
                    <p className="text-xs text-neutral-600 mb-1.5">
                      {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? ", et al." : ""}
                      {paper.year && <> · {paper.year}</>}
                      {paper.journal && <> · <span className="italic">{paper.journal}</span></>}
                    </p>
                    {paper.abstract && (
                      <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2 mb-2">
                        {paper.abstract}
                      </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {paper.citationCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-neutral-600">
                          <Quote className="w-3 h-3" />
                          {paper.citationCount.toLocaleString()} citations
                        </span>
                      )}
                      {paper.isOpenAccess && (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-medium">
                          Open Access
                        </span>
                      )}
                      {paper.pdfUrl && (
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-400 transition-colors"
                        >
                          <BookOpen className="w-3 h-3" />
                          PDF
                        </a>
                      )}
                      <div className="ml-auto flex items-center gap-3">
                        <button
                          onClick={() => toggleSaved(paper.id)}
                          aria-label={isSaved ? "Remove from saved" : "Save paper"}
                          aria-pressed={isSaved}
                          className={`flex items-center gap-1 text-xs transition-colors active:scale-90 ${
                            isSaved ? "text-amber-400" : "text-neutral-600 hover:text-neutral-300"
                          }`}
                          style={{ transitionTimingFunction: EASE }}
                        >
                          <Bookmark className={`w-3 h-3 ${isSaved ? "onyx-pop fill-amber-400" : ""}`} />
                          {isSaved ? "Saved" : "Save"}
                        </button>
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open paper in new tab"
                          className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {total > results.length && (
            <div className="text-center mt-5 onyx-appear">
              <button
                onClick={goToFullSearch}
                className="text-sm text-neutral-500 hover:text-neutral-200 border border-white/8 rounded-xl px-5 py-2.5 hover:border-white/20 transition-all active:scale-[0.97]"
                style={{ transitionTimingFunction: EASE }}
              >
                View all results in Semantic Search →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Module cards */}
      {!hasResults && !loading && !searched && (
        <div className="max-w-2xl mx-auto px-4 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.href}
                  onClick={() => setLocation(mod.href)}
                  className={`text-left border border-white/6 rounded-2xl p-5 hover:border-white/12 hover:bg-white/2 hover:-translate-y-0.5 hover:shadow-lg ${mod.glow} transition-all group active:scale-[0.98] active:translate-y-0 onyx-appear`}
                  style={{ animationDelay: `${280 + i * 50}ms`, transitionTimingFunction: EASE, transitionDuration: "250ms" }}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${mod.bgColor} border ${mod.borderColor} transition-transform group-hover:scale-110`} style={{ transitionTimingFunction: EASE }}>
                    <Icon className={`w-4 h-4 ${mod.accentColor}`} />
                  </div>
                  <div className="font-semibold text-sm text-neutral-200 mb-1.5">{mod.label}</div>
                  <p className="text-xs text-neutral-600 leading-relaxed mb-3">{mod.description}</p>
                  <div className={`flex items-center gap-1 text-xs font-medium ${mod.accentColor} opacity-70 group-hover:opacity-100 transition-opacity`}>
                    Explore
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" style={{ transitionTimingFunction: EASE }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
