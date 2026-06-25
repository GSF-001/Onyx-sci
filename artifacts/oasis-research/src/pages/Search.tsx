import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import { useSemanticSearch, useGetTrendingSearches } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ExternalLink, FileText, Tag, CalendarDays, BookOpen, Quote, Sparkles, TrendingUp } from "lucide-react";

function CategoryBadge({ cat }: { cat: string }) {
  const colors: Record<string, string> = {
    "cs.AI": "bg-blue-50 text-blue-700 border-blue-200",
    "cs.LG": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "cs.CV": "bg-violet-50 text-violet-700 border-violet-200",
    "cs.CL": "bg-purple-50 text-purple-700 border-purple-200",
    "cs.NE": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "stat.ML": "bg-teal-50 text-teal-700 border-teal-200",
    "math": "bg-amber-50 text-amber-700 border-amber-200",
    "physics": "bg-orange-50 text-orange-700 border-orange-200",
    "q-bio": "bg-green-50 text-green-700 border-green-200",
    "eess": "bg-rose-50 text-rose-700 border-rose-200",
  };
  const prefix = cat.split(".")[0];
  const cls = colors[cat] ?? colors[prefix] ?? "bg-neutral-100 text-neutral-600 border-neutral-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded border ${cls}`}>
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
      <div className="max-w-5xl mx-auto p-8">
        {/* Header + Search bar */}
        <div className="mb-10">
          <h1 className="text-3xl font-serif font-bold mb-2">Pencarian Semantik</h1>
          <p className="text-neutral-500 mb-8">
            Temukan makalah ilmiah dari <span className="font-medium text-neutral-700">ArXiv</span> dengan kueri bahasa alami · PDF selalu tersedia.
          </p>

          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 py-6 text-lg rounded-xl border-neutral-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20"
                placeholder="Cari makalah tentang attention mechanism, protein folding…"
              />
            </div>
            <Button type="submit" size="lg" className="rounded-xl px-8 h-auto bg-neutral-900 hover:bg-neutral-800" disabled={searchMutation.isPending}>
              {searchMutation.isPending ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mencari…</span>
              ) : "Cari"}
            </Button>
          </form>

          {/* Trending pills */}
          {!searchMutation.data && trending && trending.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-neutral-400 text-xs font-medium"><TrendingUp className="w-3.5 h-3.5" /> Populer:</span>
              {trending.slice(0, 6).map((t, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(t.query); searchMutation.mutate({ data: { query: t.query } }); }}
                  className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition text-xs"
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
              <div key={i} className="p-6 rounded-2xl border border-neutral-200 bg-white">
                <Skeleton className="h-5 w-2/3 mb-3" />
                <Skeleton className="h-3.5 w-1/3 mb-5" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-5/6 mb-2" />
                <Skeleton className="h-3 w-4/6 mb-5" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
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
                Ditemukan <span className="font-semibold text-neutral-800">{searchMutation.data.total.toLocaleString()}</span> makalah untuk{" "}
                <span className="italic">"{searchMutation.data.query}"</span>
              </span>
              <span className="ml-3 text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium border border-blue-100">ArXiv</span>
            </div>
          </div>
        )}

        {/* AI Summary */}
        {searchMutation.data?.aiSummary && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-blue-600 rounded-lg flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-blue-700 mb-1.5 uppercase tracking-wide">Ringkasan AI · GROQ</div>
                <p className="text-sm text-blue-900 leading-relaxed">{searchMutation.data.aiSummary}</p>
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

            const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : null;

            return (
              <div
                key={paper.id}
                className="rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm transition-all"
              >
                {/* Main card content */}
                <div className="p-6">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <a
                      href={paper.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[17px] font-semibold text-neutral-900 hover:text-blue-600 transition-colors leading-snug flex-1"
                    >
                      {paper.title}
                    </a>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[11px] font-medium rounded border border-green-200">
                        Akses Terbuka
                      </span>
                      {primaryCat && <CategoryBadge cat={primaryCat} />}
                    </div>
                  </div>

                  {/* Authors */}
                  <p className="text-sm text-neutral-600 mb-2 line-clamp-1">
                    {paper.authors.slice(0, 5).join(", ")}{paper.authors.length > 5 ? ` +${paper.authors.length - 5} lainnya` : ""}
                  </p>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-500 mb-4">
                    {publishedDate && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Diterbitkan {fmtDate(publishedDate)}
                      </span>
                    )}
                    {updatedDate && updatedDate !== publishedDate && (
                      <span className="flex items-center gap-1">
                        Diperbarui {fmtDate(updatedDate)}
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
                      <span className="flex items-center gap-1 font-medium text-neutral-600">
                        <FileText className="w-3.5 h-3.5" /> {journal}
                      </span>
                    )}
                  </div>

                  {/* Categories */}
                  {cats.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-4">
                      <Tag className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                      {cats.slice(0, 6).map((c, i) => <CategoryBadge key={i} cat={c} />)}
                      {cats.length > 6 && <span className="text-[11px] text-neutral-400">+{cats.length - 6}</span>}
                    </div>
                  )}

                  {/* Abstract */}
                  <p className={`text-sm text-neutral-700 leading-relaxed mb-5 ${isExpanded ? "" : "line-clamp-3"}`}>
                    {paper.abstract || "Abstrak tidak tersedia."}
                  </p>
                  {paper.abstract && paper.abstract.length > 300 && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : paper.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 mb-4 font-medium"
                    >
                      {isExpanded ? "Sembunyikan ↑" : "Baca selengkapnya ↓"}
                    </button>
                  )}

                  {/* Comment/note */}
                  {comment && (
                    <p className="text-xs text-neutral-500 italic mb-4 border-l-2 border-neutral-200 pl-3">{comment}</p>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                      asChild
                    >
                      <a href={paper.pdfUrl ?? "#"} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-3.5 h-3.5" /> Buka PDF
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-lg gap-1.5" asChild>
                      <a href={paper.url ?? "#"} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" /> Halaman ArXiv
                      </a>
                    </Button>
                    {doi && (
                      <Button variant="ghost" size="sm" className="rounded-lg text-neutral-500 gap-1.5" asChild>
                        <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer">
                          <Quote className="w-3.5 h-3.5" /> DOI
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {searchMutation.data && searchMutation.data.papers.length === 0 && (
          <div className="text-center py-20 text-neutral-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1">Tidak ada hasil ditemukan</p>
            <p className="text-sm">Coba kata kunci yang berbeda atau lebih umum</p>
          </div>
        )}

        {/* Error state */}
        {searchMutation.isError && (
          <div className="text-center py-20 text-neutral-400">
            <p className="text-lg font-medium mb-1 text-red-500">Pencarian gagal</p>
            <p className="text-sm">Periksa koneksi internet Anda dan coba lagi</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
