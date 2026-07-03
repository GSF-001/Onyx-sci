import React, { useMemo, useState } from "react";
import MainLayout from "../components/MainLayout";
import { useGetPapers, useRemoveSavedPaper } from "@workspace/api-client-react";
import { PaperListPulse } from "../components/PulseLoader";
import { BookOpen, ExternalLink, Calendar, Quote, Search, Trash2, X } from "lucide-react";

export default function PapersPage() {
  const { data: papers, isLoading, isError } = useGetPapers();
  const removePaper = useRemoveSavedPaper();
  const [query, setQuery] = useState("");
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const filteredPapers = useMemo(() => {
    if (!papers) return [];
    const q = query.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.authors.some((a) => a.toLowerCase().includes(q)) ||
      p.journal?.toLowerCase().includes(q)
    );
  }, [papers, query]);

  const confirmRemove = (id: string) => {
    removePaper.mutate({ paperId: id }, { onSettled: () => setPendingRemoveId(null) });
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">Saved Papers</h1>
          <p className="text-neutral-500 text-sm">
            Your personal research library — papers you have saved for later.
          </p>
        </div>

        {!isLoading && !isError && papers && papers.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter your saved papers by title, author, journal…"
              className="w-full pl-11 pr-10 py-3 text-sm rounded-xl border border-white/8 bg-white/3 text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-white/20 focus:bg-white/5 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear filter"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {isLoading && <PaperListPulse count={5} />}

        {isError && (
          <div className="text-center py-20 border border-red-500/15 bg-red-500/5 rounded-2xl">
            <p className="text-red-400 font-medium mb-1">Couldn't load your saved papers</p>
            <p className="text-neutral-600 text-sm">Check your connection and try refreshing the page.</p>
          </div>
        )}

        {!isLoading && !isError && papers && papers.length > 0 && filteredPapers.length === 0 && (
          <div className="text-center py-16 border border-dashed border-white/8 rounded-2xl">
            <Search className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm font-medium mb-1">No matches for "{query}"</p>
            <p className="text-neutral-600 text-xs">Try a different title, author, or journal name.</p>
          </div>
        )}

        {!isLoading && !isError && filteredPapers.length > 0 && (
          <div className="space-y-4">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="p-6 rounded-2xl border border-white/6 bg-white/2 hover:border-white/12 hover:bg-white/3 transition-all group"
                data-testid={`card-paper-${paper.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-200 mb-1 group-hover:text-sky-400 transition-colors leading-snug">
                      {paper.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-neutral-600 mb-3 flex-wrap">
                      <span>{paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}</span>
                      {paper.journal && (
                        <>
                          <span>·</span>
                          <span className="italic">{paper.journal}</span>
                        </>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {paper.year}
                      </span>
                      {paper.citationCount != null && (
                        <span className="flex items-center gap-1 font-mono">
                          <Quote className="w-3 h-3" />
                          {paper.citationCount} citations
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                      {paper.abstract}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {paper.noveltyScore != null && (
                      <span className="text-xs px-2.5 py-1 bg-sky-500/10 text-sky-400 rounded-full font-bold border border-sky-500/20 font-mono">
                        Novelty {paper.noveltyScore.toFixed(1)}
                      </span>
                    )}
                    {paper.isOpenAccess && (
                      <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-semibold border border-emerald-500/20">
                        Open Access
                      </span>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-600 hover:text-sky-400 transition-colors"
                          data-testid={`link-paper-${paper.id}`}
                          aria-label="Open paper"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setPendingRemoveId(paper.id)}
                        className="text-neutral-600 hover:text-red-400 transition-colors"
                        aria-label="Remove from library"
                        data-testid={`button-remove-${paper.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {pendingRemoveId === paper.id && (
                  <div className="mt-4 pt-4 border-t border-white/6 flex items-center justify-between flex-wrap gap-2">
                    <p className="text-xs text-neutral-400">Remove this paper from your library?</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPendingRemoveId(null)}
                        className="text-xs px-3 py-1.5 rounded-lg text-neutral-500 hover:text-neutral-200 border border-white/8 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => confirmRemove(paper.id)}
                        disabled={removePaper.isPending}
                        className="text-xs px-3 py-1.5 rounded-lg text-red-400 border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        {removePaper.isPending ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && (!papers || papers.length === 0) && (
          <div className="text-center py-20 border border-dashed border-white/8 rounded-2xl">
            <BookOpen className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-400 mb-2">No saved papers yet</h3>
            <p className="text-neutral-600 text-sm">
              Search for papers and save them to build your research library.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
