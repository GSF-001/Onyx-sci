import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import { useSemanticSearch, getGetTrendingSearchesQueryKey, useGetTrendingSearches } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, BookmarkPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const searchMutation = useSemanticSearch();
  const { data: trending } = useGetTrendingSearches();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    searchMutation.mutate({ data: { query } });
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-12">
          <h1 className="text-3xl font-serif font-bold mb-4">Pencarian Semantik</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">Temukan makalah ilmiah dengan kueri bahasa alami dari 280M+ sumber.</p>
          
          <form onSubmit={handleSearch} className="flex space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 py-6 text-lg rounded-xl border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm"
                placeholder="Cari makalah tentang mekanisme atensi dalam transformer..."
              />
            </div>
            <Button type="submit" size="lg" className="rounded-xl px-8 h-auto" disabled={searchMutation.isPending}>
              {searchMutation.isPending ? "Mencari..." : "Cari"}
            </Button>
          </form>

          {!searchMutation.data && trending && trending.length > 0 && (
            <div className="mt-6 flex items-center space-x-3 text-sm">
              <span className="text-neutral-500">Trending:</span>
              {trending.slice(0, 3).map((t, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    setQuery(t.query);
                    searchMutation.mutate({ data: { query: t.query } });
                  }}
                  className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                >
                  {t.query}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {searchMutation.isPending && (
            <>
              {[1, 2, 3].map(i => (
                <div key={i} className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-6" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </>
          )}

          {searchMutation.data && (
            <div className="mb-6 flex justify-between items-center text-sm text-neutral-500">
              <span>Ditemukan {searchMutation.data.total.toLocaleString()} hasil untuk "{searchMutation.data.query}"</span>
            </div>
          )}

          {searchMutation.data?.papers.map(paper => (
            <div key={paper.id} className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {paper.title}
                </h3>
                {paper.noveltyScore && (
                  <div className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-md border border-green-200 dark:border-green-800">
                    Novelty: {Math.round(paper.noveltyScore * 100)}%
                  </div>
                )}
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                {paper.authors.slice(0,3).join(", ")}{paper.authors.length > 3 ? " et al." : ""} · {paper.year} {paper.journal ? `· ${paper.journal}` : ''} 
                <span className="ml-2 text-neutral-400 dark:text-neutral-500">({(paper.citationCount || 0).toLocaleString()} sitasi)</span>
                {paper.isOpenAccess && <span className="ml-2 text-green-600 font-medium">· Akses Terbuka</span>}
              </p>
              <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed mb-6 line-clamp-3">
                {paper.abstract}
              </p>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="rounded-lg">
                  <BookmarkPlus className="w-4 h-4 mr-2" /> Simpan
                </Button>
                {paper.pdfUrl && (
                  <Button variant="outline" size="sm" className="rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50" asChild>
                    <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" /> Buka PDF
                    </a>
                  </Button>
                )}
                {paper.url && (
                  <Button variant="ghost" size="sm" className="rounded-lg text-neutral-500" asChild>
                    <a href={paper.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" /> Lihat Sumber
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}