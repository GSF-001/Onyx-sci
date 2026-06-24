import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Search, ExternalLink, BookOpen, Quote, X, Loader2, ArrowRight } from "lucide-react";
import OasisLogo from "../components/OasisLogo";

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
  "protein folding deep learning",
  "CRISPR cancer therapy",
  "large language models drug discovery",
  "single cell RNA sequencing",
  "quantum error correction",
  "mRNA vaccine delivery",
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

  const hasResults = results.length > 0;

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col">
      {/* Sticky search header (only when results exist) */}
      {hasResults && (
        <header className="sticky top-0 z-20 bg-white border-b border-neutral-100 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <button onClick={() => setLocation("/")} className="flex-shrink-0">
              <OasisLogo size={22} color="#111" />
            </button>
            <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
              <div className="flex-1 flex items-center border border-neutral-200 rounded-xl px-3 py-2 focus-within:border-neutral-400 transition-colors bg-neutral-50">
                <Search className="w-4 h-4 text-neutral-400 flex-shrink-0 mr-2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none text-neutral-900 placeholder:text-neutral-400"
                  placeholder="Search again..."
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className="text-neutral-400 hover:text-neutral-600 ml-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-xl hover:bg-neutral-700 disabled:opacity-40 transition-colors flex-shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </button>
            </form>
          </div>
        </header>
      )}

      {/* Hero — shown when no results */}
      {!hasResults && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          {/* Logo + name */}
          <div className="flex flex-col items-center mb-10">
            <OasisLogo size={52} color="#111" className="mb-4" />
            <div className="text-center leading-none">
              <div className="text-2xl font-black tracking-[0.08em] text-neutral-900">OASIS</div>
              <div className="text-base font-medium tracking-[0.15em] text-neutral-500 -mt-0.5">Research</div>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 text-center mb-3 max-w-lg leading-tight">
            Powerful Tools for<br className="hidden md:block" /> Breakthrough Research
          </h1>
          <p className="text-neutral-500 text-sm md:text-base text-center mb-8 max-w-sm leading-relaxed">
            Search millions of papers, discover research gaps, and analyze scientific trends.
          </p>

          {/* Main search box */}
          <form onSubmit={handleSubmit} className="w-full max-w-xl">
            <div className="flex items-center border border-neutral-200 rounded-2xl px-4 py-3.5 focus-within:border-neutral-400 focus-within:shadow-sm transition-all bg-white shadow-sm">
              <Search className="w-5 h-5 text-neutral-400 flex-shrink-0 mr-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent text-sm md:text-base outline-none text-neutral-900 placeholder:text-neutral-400"
                placeholder="Search papers, concepts, methods, or ask a question..."
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="text-neutral-400 hover:text-neutral-600 ml-2">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="mt-3 w-full py-3 bg-neutral-900 text-white text-sm font-medium rounded-2xl hover:bg-neutral-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </form>

          {/* Trending queries */}
          {!loading && (
            <div className="mt-8 w-full max-w-xl">
              <p className="text-xs text-neutral-400 text-center mb-3 font-medium uppercase tracking-wider">Trending</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {TRENDING.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setQuery(t); doSearch(t); }}
                    className="text-xs px-3 py-1.5 border border-neutral-200 rounded-full text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick access to AI modules */}
          <div className="mt-12 flex flex-wrap gap-3 justify-center">
            {[
              { label: "AI Copilot", href: "/copilot" },
              { label: "Knowledge Graph", href: "/graph" },
              { label: "Gap Discovery", href: "/gaps" },
              { label: "Novelty Trends", href: "/trends" },
            ].map((m) => (
              <button
                key={m.href}
                onClick={() => setLocation(m.href)}
                className="text-xs text-neutral-500 hover:text-neutral-900 px-3 py-1.5 border border-neutral-100 rounded-full hover:border-neutral-300 transition-colors flex items-center gap-1"
              >
                {m.label}
                <ArrowRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="max-w-3xl mx-auto px-4 py-6 w-full">
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !hasResults && (
        <div className="max-w-3xl mx-auto px-4 py-8 w-full space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-neutral-100 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-neutral-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-neutral-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-neutral-100 rounded w-full mb-1" />
              <div className="h-3 bg-neutral-100 rounded w-4/5" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <div className="max-w-3xl mx-auto px-4 py-6 w-full pb-16">
          {/* Summary bar */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-500">
              About <span className="font-semibold text-neutral-900">{total.toLocaleString()}</span> results for{" "}
              <span className="italic">"{submitted}"</span>
            </p>
            <button
              onClick={() => setLocation("/search")}
              className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
            >
              Advanced search <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* AI Summary */}
          {aiSummary && (
            <div className="mb-6 px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 leading-relaxed">
              <span className="font-semibold text-neutral-900 mr-2">AI Summary</span>
              {aiSummary}
            </div>
          )}

          {/* Paper cards */}
          <div className="space-y-3">
            {results.map((paper) => (
              <article
                key={paper.id}
                className="border border-neutral-100 rounded-2xl p-5 hover:border-neutral-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-base font-semibold text-neutral-900 group-hover:text-blue-700 transition-colors leading-snug mb-1"
                    >
                      {paper.title}
                    </a>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500 mb-2">
                      <span>{paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}</span>
                      {paper.year && <><span>·</span><span>{paper.year}</span></>}
                      {paper.journal && <><span>·</span><span className="italic truncate max-w-[160px]">{paper.journal}</span></>}
                    </div>

                    {/* Abstract */}
                    {paper.abstract && (
                      <p className="text-sm text-neutral-600 leading-relaxed line-clamp-3">
                        {paper.abstract}
                      </p>
                    )}
                  </div>

                  {/* Right badges */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {paper.citationCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-neutral-500">
                        <Quote className="w-3 h-3" />
                        <span>{paper.citationCount.toLocaleString()}</span>
                      </div>
                    )}
                    {paper.isOpenAccess && (
                      <span className="text-[10px] px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-full font-medium">
                        Open Access
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-3 pt-2 border-t border-neutral-50">
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Paper
                  </a>
                  {paper.pdfUrl && (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      PDF
                    </a>
                  )}
                  <button
                    onClick={() => setLocation(`/copilot?q=${encodeURIComponent(paper.title)}`)}
                    className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-blue-600 transition-colors ml-auto"
                  >
                    Ask AI about this →
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Load more */}
          {results.length > 0 && total > results.length && (
            <div className="text-center mt-6">
              <button
                onClick={() => setLocation("/search")}
                className="text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-xl px-5 py-2.5 hover:border-neutral-400 transition-colors"
              >
                See all results in Semantic Search →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
