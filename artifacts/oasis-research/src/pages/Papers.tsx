import React from "react";
import MainLayout from "../components/MainLayout";
import { useGetPapers } from "@workspace/api-client-react";
import { BookOpen, ExternalLink, Calendar, Quote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PapersPage() {
  const { data: papers, isLoading } = useGetPapers();

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        <div className="mb-10">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">Saved Papers</h1>
          <p className="text-neutral-500 text-sm">
            Your personal research library — papers you have saved for later.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/6 bg-white/2">
                <Skeleton className="h-6 w-3/4 mb-3 bg-white/5" />
                <Skeleton className="h-4 w-1/3 mb-4 bg-white/4" />
                <Skeleton className="h-16 w-full bg-white/3" />
              </div>
            ))}
          </div>
        ) : papers && papers.length > 0 ? (
          <div className="space-y-4">
            {papers.map((paper) => (
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
                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-600 hover:text-sky-400 transition-colors"
                        data-testid={`link-paper-${paper.id}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
