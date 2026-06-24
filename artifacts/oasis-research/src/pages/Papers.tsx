import React from "react";
import MainLayout from "../components/MainLayout";
import { useGetPapers } from "@workspace/api-client-react";
import { BookOpen, ExternalLink, Calendar, Quote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PapersPage() {
  const { data: papers, isLoading } = useGetPapers();

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-10">
          <h1 className="text-3xl font-serif font-bold mb-2">Saved Papers</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Your personal research library — papers you have saved for later.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/3 mb-4" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : papers && papers.length > 0 ? (
          <div className="space-y-4">
            {papers.map((paper) => (
              <div
                key={paper.id}
                className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group"
                data-testid={`card-paper-${paper.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {paper.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3 flex-wrap">
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
                        <span className="flex items-center gap-1">
                          <Quote className="w-3 h-3" />
                          {paper.citationCount} citations
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {paper.abstract}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {paper.noveltyScore != null && (
                      <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-semibold border border-blue-200 dark:border-blue-800">
                        Novelty {paper.noveltyScore.toFixed(1)}
                      </span>
                    )}
                    {paper.isOpenAccess && (
                      <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-semibold border border-green-200 dark:border-green-800">
                        Open Access
                      </span>
                    )}
                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-400 hover:text-blue-500 transition-colors"
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
          <div className="text-center py-20 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl">
            <BookOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">No saved papers yet</h3>
            <p className="text-neutral-500 text-sm">
              Search for papers and save them to build your research library.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
