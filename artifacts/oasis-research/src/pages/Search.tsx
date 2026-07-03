import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import MainLayout from "../components/MainLayout";
import { SaveMenu } from "../components/PaperCard";
import { PaperListPulse } from "../components/PulseLoader";
import { useSemanticSearch, useGetTrendingSearches } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Search, ExternalLink, FileText, Tag, CalendarDays, BookOpen, Quote, Sparkles,
  TrendingUp, ArrowUpDown, Check,
} from "lucide-react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function CategoryBadge({ cat }: { cat: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded border border-white/10 bg-white/5 text-neutral-400">
      {cat}
    </span>
  );
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : null;
}

export default function SearchPage() {
  const [location] = useLocation();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "recent">("relevance");
  const [toast, setToast] = useState<string | null>(null);

  const searchMutation = useSemanticSearch();
  const { data: trending, isLoading: trendingLoading } = useGetTrendingSearches();

  // Pick up ?q= deep links from Home's "View all results" and site-wide search shortcut.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setQuery(q);
      searchMutation.mutate({ data: { query: q } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpenAccessOnly(false);
    setSortBy("relevance");
    searchMutation.mutate({ data: { query } });
  };

  const rawResults = searchMutation.data?.papers ?? [];
  const displayedResults = useMemo(() => {
    let list = openAccessOnly ? rawResults.filter((p: any) => !!p.pdfUrl) : rawResults;
    if (sortBy === "recent") {
      list = [...list].sort((a: any, b: any) => {
        const da = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const db = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        return db - da;
      });
    }
    return list;
  }, [rawResults, openAccessOnly, sortBy]);

  return (
    <MainLayout>
      <style>{`
        @keyframes onyx-toast-in { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .onyx-toast { animation: onyx-toast-in 0.4s ${EASE} both; }
        @media (prefers-reduced-motion: reduce) { .onyx-toast { animation: none !important; } }
      `}</style>

      {toast && (
        <div
          className="onyx-toast fixed bottom-6 left-1/2 z-40 flex items-center gap-2 text-xs font-medium text-neutral-200 px-4 py-2.5 rounded-full"
          style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(20,20,20,0.9)", backdropFilter: "blur(12px)" }}
        >
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400/20">
            <Check className="w-2.5 h-2.5 text-emerald-400" />
          </span>
          {toast}
        </div>
      )}

      <div className="max-w-5xl mx-auto p-6 md:p-8">
        {/* Header + Search bar */}
        <div className="mb-10">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">Semantic Search</h1>
          <p className="text-neutral-500 mb-8 text-sm">
            Find scientific papers from <span className="font-medium text-neutral-300">ArXiv</span> with natural language queries.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-base rounded-xl border border-white/10 bg-white/4 text-neutral-100 placeholder:text-neutral-600 outline-none focus:border-white/25 focus:bg-white/5 transition-all"
                placeholder="Search for attention mechanism, protein folding…"
              />
            </div>
            <Button
              type="submit"
              className="rounded-xl px-8 h-auto bg-white text-black font-bold hover:bg-neutral-100 transition-colors"
              disabled={searchMutation.isPending || !query.trim()}
            >
              {searchMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Searching…
                </span>
              ) : "Search"}
            </Button>
          </form>

          {/* Trending pills */}
          {!searchMutation.data && !searchMutation.isPending && (
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-neutral-600 text-xs font-medium flex-shrink-0">
                <TrendingUp className="w-3.5 h-3.5" /> Trending:
              </span>
              {trendingLoading ? (
                [0, 1, 2].map((i) => <div key={i} className="h-7 w-24 rounded-full bg-white/4" />)
              ) : trending && trending.length > 0 ? (
                trending.slice(0, 6).map((t, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(t.query); searchMutation.mutate({ data: { query: t.query } }); }}
                    className="px-3 py-1.5 bg-white/5 border border-white/8 text-neutral-400 rounded-full hover:bg-white/8 hover:text-neutral-200 hover:border-white/16 transition-all text-xs"
                  >
                    {t.query}
                  </button>
                ))
              ) : (
                <span className="text-xs text-neutral-700">No trending searches right now.</span>
              )}
            </div>
          )}
        </div>

        {searchMutation.isPending && <PaperListPulse count={4} />}

        {/* Results header + filters */}
        {searchMutation.data && !searchMutation.isPending && (
          <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-sm text-neutral-500">
                Found <span className="font-semibold text-neutral-200">{searchMutation.data.total.toLocaleString()}</span> papers for{" "}
                <span className="italic text-neutral-400">"{searchMutation.data.query}"</span>
              </span>
              <span className="ml-3 text-xs px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-full font-medium border border-sky-500/15">ArXiv</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpenAccessOnly((v) => !v)}
                aria-pressed={openAccessOnly}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all active:scale-95"
                style={{
                  border: openAccessOnly ? "1px solid rgba(56,189,248,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  background: openAccessOnly ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.02)",
                  color: openAccessOnly ? "#38bdf8" : "rgb(115,115,115)",
                }}
              >
                <FileText className="w-3 h-3" />
                Has PDF
              </button>
              <button
                onClick={() => setSortBy((s) => (s === "relevance" ? "recent" : "relevance"))}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-neutral-500 hover:text-neutral-200 transition-all active:scale-95"
                style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
              >
                <ArrowUpDown className="w-3 h-3" />
                {sortBy === "relevance" ? "Relevance" : "Most recent"}
              </button>
            </div>
          </div>
        )}

        {/* AI Summary */}
        {searchMutation.data?.aiSummary && (
          <div className="mb-6 p-5 rounded-2xl bg-violet-500/6 border border-violet-500/15">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-violet-500/20 rounded-lg flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-violet-400 mb-1.5 uppercase tracking-widest">AI Summary</div>
                <p className="text-sm text-neutral-300 leading-relaxed">{searchMutation.data.aiSummary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filtered-to-empty state */}
        {searchMutation.data && rawResults.length > 0 && displayedResults.length === 0 && (
          <div className="text-center text-xs text-neutral-600 border border-white/6 rounded-2xl py-8">
            Nothing matches this filter — try turning "Has PDF" off.
          </div>
        )}

        {/* Paper cards */}
        <div className="space-y-4">
          {displayedResults.map((paper: any) => {
            const isExpanded = expandedId === paper.id;
            const cats = paper.categories as string[] | undefined ?? [];
            const primaryCat = paper.primaryCategory as string | undefined;
            const publishedDate = paper.publishedDate as string | undefined;
            const arxivId = paper.arxivId as string | undefined;
            const doi = paper.doi as string | undefined;
            const journal = paper.journal as string | undefined;
            const comment = paper.comment as string | undefined;

            return (
              <div
                key={paper.id}
                className="rounded-2xl border border-white/6 bg-white/2 hover:border-white/12 hover:bg-white/3 transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <a
                      href={paper.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[17px] font-semibold text-neutral-200 hover:text-sky-400 transition-colors leading-snug flex-1"
                    >
                      {paper.title}
                    </a>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                      {paper.pdfUrl && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[11px] font-medium rounded border border-emerald-500/20">
                          Open Access
                        </span>
                      )}
                      {primaryCat && <CategoryBadge cat={primaryCat} />}
                    </div>
                  </div>

                  <p className="text-sm text-neutral-500 mb-2 line-clamp-1">
                    {paper.authors.slice(0, 5).join(", ")}{paper.authors.length > 5 ? ` +${paper.authors.length - 5} more` : ""}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-600 mb-4">
                    {publishedDate && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {fmtDate(publishedDate)}
                      </span>
                    )}
                    {arxivId && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> arXiv:{arxivId}
                      </span>
                    )}
                    {doi && (
                      <span className="flex items-center gap-1">
                        <Quote className="w-3.5 h-3.5" /> DOI:{doi}
                      </span>
                    )}
                    {journal && (
                      <span className="flex items-center gap-1 font-medium text-neutral-500">
                        <FileText className="w-3.5 h-3.5" /> {journal}
                      </span>
                    )}
                  </div>

                  {cats.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-4">
                      <Tag className="w-3 h-3 text-neutral-600 flex-shrink-0" />
                      {cats.slice(0, 6).map((c, i) => <CategoryBadge key={i} cat={c} />)}
                      {cats.length > 6 && <span className="text-[11px] text-neutral-600">+{cats.length - 6}</span>}
                    </div>
                  )}

                  <p className={`text-sm text-neutral-500 leading-relaxed mb-5 ${isExpanded ? "" : "line-clamp-3"}`}>
                    {paper.abstract || "Abstract not available."}
                  </p>
                  {paper.abstract && paper.abstract.length > 300 && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : paper.id)}
                      className="text-xs text-sky-500 hover:text-sky-400 mb-4 font-medium"
                    >
                      {isExpanded ? "Show less ↑" : "Read more ↓"}
                    </button>
                  )}

                  {comment && (
                    <p className="text-xs text-neutral-600 italic mb-4 border-l-2 border-white/10 pl-3">{comment}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/20 gap-1.5"
                      asChild
                    >
                      <a href={paper.pdfUrl ?? "#"} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-3.5 h-3.5" /> Open PDF
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg gap-1.5 border-white/10 bg-transparent text-neutral-400 hover:bg-white/6 hover:text-neutral-200"
                      asChild
                    >
                      <a href={paper.url ?? "#"} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" /> ArXiv Page
                      </a>
                    </Button>
                    <div className="ml-auto">
                      <SaveMenu paper={paper} onSaved={(name) => setToast(`Saved to "${name}"`)} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {searchMutation.data && searchMutation.data.papers.length === 0 && (
          <div className="text-center py-20 text-neutral-600">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1 text-neutral-400">No results found</p>
            <p className="text-sm">Try different or more general keywords</p>
          </div>
        )}

        {/* Error state */}
        {searchMutation.isError && (
          <div className="text-center py-20">
            <p className="text-lg font-medium mb-1 text-red-400">Search failed</p>
            <p className="text-sm text-neutral-600">Check your connection and try again</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
