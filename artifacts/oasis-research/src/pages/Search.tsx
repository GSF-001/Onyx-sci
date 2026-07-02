import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import { useSemanticSearch, useGetTrendingSearches } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ExternalLink, FileText, Tag, CalendarDays, BookOpen, Quote, Sparkles, TrendingUp } from "lucide-react";

function CategoryBadge({ cat }: { cat: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded border border-white/10 bg-white/5 text-neutral-400">
      {cat}
    </span>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchMutation = useSemanticSearch();
  const { data: trending } = useGetTrendingSearches();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    searchMutation.mutate({ data: { query } });
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        {/* Header + Search bar */}
        <div className="mb-10">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">Semantic Search</h1>
          <p className="text-neutral-500 mb-8 text-sm">
            Find scientific papers from <span className="font-medium text-neutral-300">ArXiv</span> with natural language queries · PDF always available.
          </p>

          <form onSubmit={handleSearch} className="flex gap-3">
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
              disabled={searchMutation.isPending}
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
          {!searchMutation.data && trending && trending.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-neutral-600 text-xs font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> Trending:
              </span>
              {trending.slice(0, 6).map((t, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(t.query); searchMutation.mutate({ data: { query: t.query } }); }}
                  className="px-3 py-1.5 bg-white/5 border border-white/8 text-neutral-400 rounded-full hover:bg-white/8 hover:text-neutral-200 hover:border-white/16 transition-all text-xs"
                >
                  {t.query}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Skeleton loading */}
        {searchMutation.isPending && (
          <div className="space-y-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-6 rounded-2xl border border-white/6 bg-white/2">
                <Skeleton className="h-5 w-2/3 mb-3 bg-white/6" />
                <Skeleton className="h-3.5 w-1/3 mb-5 bg-white/4" />
                <Skeleton className="h-3 w-full mb-2 bg-white/4" />
                <Skeleton className="h-3 w-5/6 mb-2 bg-white/4" />
                <Skeleton className="h-3 w-4/6 mb-5 bg-white/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24 rounded-lg bg-white/4" />
                  <Skeleton className="h-8 w-24 rounded-lg bg-white/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results header */}
        {searchMutation.data && !searchMutation.isPending && (
          <div className="mb-5 flex items-center justify-between">
            <div>
              <span className="text-sm text-neutral-500">
                Found <span className="font-semibold text-neutral-200">{searchMutation.data.total.toLocaleString()}</span> papers for{" "}
                <span className="italic text-neutral-400">"{searchMutation.data.query}"</span>
              </span>
              <span className="ml-3 text-xs px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-full font-medium border border-sky-500/15">ArXiv</span>
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
                <div className="text-xs font-bold text-violet-400 mb-1.5 uppercase tracking-widest">AI Summary · GROQ</div>
                <p className="text-sm text-neutral-300 leading-relaxed">{searchMutation.data.aiSummary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Paper cards */}
        <div className="space-y-4">
          {searchMutation.data?.papers.map((paper) => {
            const isExpanded = expandedId === paper.id;
            const cats = (paper as any).categories as string[] | undefined ?? [];
            const primaryCat = (paper as any).primaryCategory as string | undefined;
            const publishedDate = (paper as any).publishedDate as string | undefined;
            const updatedDate = (paper as any).updatedDate as string | undefined;
            const arxivId = (paper as any).arxivId as string | undefined;
            const doi = (paper as any).doi as string | undefined;
            const journal = paper.journal as string | undefined;
            const comment = (paper as any).comment as string | undefined;

            const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : null;

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
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[11px] font-medium rounded border border-emerald-500/20">
                        Open Access
                      </span>
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
