import React, { useState, useRef } from "react";
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
    description: "Find the most relevant papers using natural language and semantic understanding.",
  },
  {
    icon: Sparkles,
    label: "AI Copilot",
    href: "/copilot",
    accentColor: "text-violet-400",
    bgColor: "bg-violet-400/8",
    borderColor: "border-violet-400/15",
    description: "Get AI-generated summaries, synthesis, and answers with real citations from literature.",
  },
  {
    icon: Network,
    label: "Knowledge Graph",
    href: "/graph",
    accentColor: "text-emerald-400",
    bgColor: "bg-emerald-400/8",
    borderColor: "border-emerald-400/15",
    description: "Visualize relationships between papers, authors, concepts, and research fields.",
  },
  {
    icon: Lightbulb,
    label: "Gap Discovery",
    href: "/gaps",
    accentColor: "text-amber-400",
    bgColor: "bg-amber-400/8",
    borderColor: "border-amber-400/15",
    description: "Identify underexplored research areas and discover breakthrough opportunities.",
  },
  {
    icon: TrendingUp,
    label: "Novelty Trends",
    href: "/trends",
    accentColor: "text-orange-400",
    bgColor: "bg-orange-400/8",
    borderColor: "border-orange-400/15",
    description: "Track rising topics and predict the direction of future research.",
  },
  {
    icon: Users,
    label: "Collaborate",
    href: "/collaborate",
    accentColor: "text-pink-400",
    bgColor: "bg-pink-400/8",
    borderColor: "border-pink-400/15",
    description: "Connect with researchers in the same field and manage research projects.",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [results, setResults] = useState<Paper[]>([]);
  const [total, setTotal] = useState(0);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  const doSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setAiSummary(null);
    setSubmitted(trimmed);
    try {
      const res = await fetch(`${BASE}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, limit: 10 }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.papers ?? []);
      setTotal(data.total ?? 0);
      setAiSummary(data.aiSummary ?? null);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSubmitted("");
    setAiSummary(null);
    setError(null);
    inputRef.current?.focus();
  };

  const hasResults = results.length > 0;

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 font-sans">
      {/* Hero + Search */}
      <div className="px-4 pt-8 pb-6 max-w-2xl mx-auto">
        {/* Logo + Name */}
        <div className="flex items-center gap-3 mb-6">
          <img src="/onyx-logo-transparent.png" alt="ONYX" className="w-8 h-8 object-contain" />
          <div className="leading-none">
            <div className="font-black text-base tracking-[0.12em] text-white">ONYX</div>
            <div className="font-medium text-[9px] tracking-[0.2em] text-neutral-500 -mt-0.5 uppercase">research</div>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight tracking-tight">
          Advanced Tools for<br />Breakthrough Research
        </h1>
        <p className="text-neutral-500 text-sm mb-5 leading-relaxed">
          Search millions of papers, understand key findings,<br className="hidden md:block" />
          and discover research gaps with AI.
        </p>

        {/* Search box */}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/25 focus-within:bg-white/3 transition-all bg-white/4 shadow-sm">
            <Search className="w-4 h-4 text-neutral-600 flex-shrink-0 mr-3" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-neutral-100 placeholder:text-neutral-600"
              placeholder="Search papers, concepts, methods, researchers..."
            />
            {query && (
              <button type="button" onClick={clearSearch} className="text-neutral-600 hover:text-neutral-400 mx-1">
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="ml-2 px-4 py-1.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-neutral-100 disabled:opacity-30 transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
            </button>
          </div>
        </form>

        {/* Trending suggestions */}
        {!hasResults && !loading && (
          <div className="mt-4">
            <p className="text-xs text-neutral-600 mb-2">Try popular searches</p>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((t) => (
                <button
                  key={t}
                  onClick={() => { setQuery(t); doSearch(t); }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-white/8 rounded-full text-neutral-500 hover:border-white/20 hover:text-neutral-200 hover:bg-white/4 transition-all"
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
        <div className="max-w-2xl mx-auto px-4 mb-4">
          <div className="text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="max-w-2xl mx-auto px-4 space-y-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-white/6 rounded-2xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-white/5 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Results */}
      {hasResults && !loading && (
        <div className="max-w-2xl mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500">
              Results for: <span className="font-semibold text-neutral-200">"{submitted}"</span>
              <span className="text-neutral-600 ml-2 text-xs">{total.toLocaleString()} found</span>
            </p>
            <button
              onClick={() => setLocation("/search")}
              className="text-xs text-neutral-500 border border-white/8 rounded-lg px-2.5 py-1 hover:border-white/20 hover:text-neutral-200 transition-colors flex items-center gap-1"
            >
              Filter <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {aiSummary && (
            <div className="mb-4 px-4 py-3 bg-sky-500/6 border border-sky-500/15 rounded-xl text-sm text-neutral-300 leading-relaxed">
              <span className="font-semibold text-sky-400 mr-1.5">AI Summary</span>
              {aiSummary}
            </div>
          )}

          <div className="space-y-3">
            {results.map((paper) => (
              <article
                key={paper.id}
                className="flex gap-3 border border-white/6 rounded-2xl p-4 hover:border-white/12 hover:bg-white/2 transition-all group"
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
                      <button className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-300 transition-colors">
                        <Bookmark className="w-3 h-3" />
                        Save
                      </button>
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {total > results.length && (
            <div className="text-center mt-5">
              <button
                onClick={() => setLocation("/search")}
                className="text-sm text-neutral-500 hover:text-neutral-200 border border-white/8 rounded-xl px-5 py-2.5 hover:border-white/20 transition-colors"
              >
                View all results in Semantic Search →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Module cards */}
      {!hasResults && !loading && (
        <div className="max-w-2xl mx-auto px-4 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.href}
                  onClick={() => setLocation(mod.href)}
                  className="text-left border border-white/6 rounded-2xl p-5 hover:border-white/12 hover:bg-white/2 transition-all group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${mod.bgColor} border ${mod.borderColor}`}>
                    <Icon className={`w-4 h-4 ${mod.accentColor}`} />
                  </div>
                  <div className="font-semibold text-sm text-neutral-200 mb-1.5">{mod.label}</div>
                  <p className="text-xs text-neutral-600 leading-relaxed mb-3">{mod.description}</p>
                  <div className={`flex items-center gap-1 text-xs font-medium ${mod.accentColor} opacity-70 group-hover:opacity-100 transition-opacity`}>
                    Explore
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
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
