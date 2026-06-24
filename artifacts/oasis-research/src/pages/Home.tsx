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
  "pelipatan protein",
  "CRISPR kanker",
  "model bahasa besar",
  "sel tunggal RNA",
  "energi terbarukan",
  "komputasi kuantum",
];

const modules = [
  {
    icon: Search,
    label: "Pencarian Semantik",
    href: "/search",
    color: "bg-blue-50 text-blue-600",
    ringColor: "ring-blue-100",
    description:
      "Temukan makalah yang paling relevan menggunakan bahasa alami dan pemahaman semantik.",
    preview: (
      <div className="bg-neutral-900 rounded-xl p-3 text-white text-xs font-mono">
        <div className="flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2 mb-2">
          <Search className="w-3 h-3 text-neutral-400 flex-shrink-0" />
          <span className="text-neutral-300 truncate">pelipatan protein dengan deep learning</span>
        </div>
        <div className="text-neutral-500 text-[10px]">12.458 hasil ditemukan</div>
      </div>
    ),
  },
  {
    icon: Sparkles,
    label: "Kopilot AI",
    href: "/copilot",
    color: "bg-purple-50 text-purple-600",
    ringColor: "ring-purple-100",
    description:
      "Dapatkan ringkasan, sintesis, dan jawaban berbasis AI dengan kutipan nyata dari literatur.",
    preview: (
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs space-y-2">
        <div className="bg-purple-100 rounded-lg px-3 py-1.5 text-purple-800 text-right text-[11px]">
          Apa saja pendekatan baru dalam pelipatan protein?
        </div>
        <div className="text-neutral-600 text-[11px] leading-relaxed">
          Berdasarkan 24 makalah, berikut adalah kemajuan-kemajuan utama...
        </div>
      </div>
    ),
  },
  {
    icon: Network,
    label: "Grafik Pengetahuan",
    href: "/graph",
    color: "bg-green-50 text-green-600",
    ringColor: "ring-green-100",
    description:
      "Visualisasikan hubungan antara makalah, penulis, konsep, dan bidang penelitian.",
    preview: (
      <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center justify-center min-h-[72px]">
        <div className="flex items-center gap-1">
          {["ML", "DL", "RL", "NLP"].map((n, i) => (
            <React.Fragment key={n}>
              <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">{n}</span>
              {i < 3 && <span className="text-green-300 text-[10px]">—</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Lightbulb,
    label: "Penemuan Celah",
    href: "/gaps",
    color: "bg-yellow-50 text-yellow-600",
    ringColor: "ring-yellow-100",
    description:
      "Identifikasi area penelitian yang kurang dieksplorasi dan temukan peluang terobosan.",
    preview: (
      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 space-y-1.5">
        {["Dampak iklim pada coral reef", "Teknik mitigasi karbon"].map((g) => (
          <div key={g} className="flex items-center gap-1.5 text-[10px] text-yellow-800">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
            {g}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: TrendingUp,
    label: "Tren Kebaruan",
    href: "/trends",
    color: "bg-orange-50 text-orange-600",
    ringColor: "ring-orange-100",
    description:
      "Lacak topik-topik yang sedang meningkat dan prediksi arah penelitian masa depan.",
    preview: (
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
        <div className="space-y-1">
          {[["LLM", 94], ["Kuantum", 87], ["CRISPR", 81]].map(([label, val]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-orange-700 w-12">{label}</span>
              <div className="flex-1 bg-orange-100 rounded-full h-1.5">
                <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Users,
    label: "Kolaborasi",
    href: "/collaborate",
    color: "bg-pink-50 text-pink-600",
    ringColor: "ring-pink-100",
    description:
      "Terhubung dengan peneliti yang bekerja di area yang sama dan kelola proyek riset.",
    preview: (
      <div className="bg-pink-50 border border-pink-100 rounded-xl p-3 flex items-center gap-2">
        {["A", "B", "C", "D"].map((l) => (
          <div key={l} className="w-7 h-7 rounded-full bg-pink-200 flex items-center justify-center text-[11px] font-bold text-pink-700 border-2 border-white -ml-2 first:ml-0">
            {l}
          </div>
        ))}
        <span className="text-[10px] text-pink-700 ml-1">4 peneliti aktif</span>
      </div>
    ),
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
      setError("Pencarian gagal. Silakan coba lagi.");
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
    <div className="min-h-screen bg-white font-sans">
      {/* Hero + Search */}
      <div className="px-4 pt-8 pb-6 max-w-2xl mx-auto">
        {/* Logo + Name */}
        <div className="flex items-center gap-3 mb-6">
          <OasisLogo size={32} color="#111" />
          <div className="leading-none">
            <div className="font-black text-base tracking-[0.08em] text-neutral-900">OASIS</div>
            <div className="font-medium text-[10px] tracking-[0.14em] text-neutral-500 -mt-0.5">Research</div>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2 leading-tight">
          Alat Canggih untuk<br />Penelitian Terobosan
        </h1>
        <p className="text-neutral-500 text-sm mb-5 leading-relaxed">
          Cari jutaan makalah, pahami temuan penting,<br className="hidden md:block" />
          dan temukan celah penelitian dengan AI.
        </p>

        {/* Search box */}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center border border-neutral-200 rounded-2xl px-4 py-3 focus-within:border-neutral-400 focus-within:shadow-sm transition-all bg-white shadow-sm">
            <Search className="w-4 h-4 text-neutral-400 flex-shrink-0 mr-3" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-neutral-900 placeholder:text-neutral-400"
              placeholder="Cari makalah, konsep, metode, peneliti, atau ajukan pertanyaan..."
            />
            {query && (
              <button type="button" onClick={clearSearch} className="text-neutral-400 hover:text-neutral-600 mx-1">
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="ml-2 px-4 py-1.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-700 disabled:opacity-40 transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Cari"}
            </button>
          </div>
        </form>

        {/* Trending — only when no search */}
        {!hasResults && !loading && (
          <div className="mt-4">
            <p className="text-xs text-neutral-400 mb-2">Coba pencarian populer</p>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((t) => (
                <button
                  key={t}
                  onClick={() => { setQuery(t); doSearch(t); }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-neutral-200 rounded-full text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
                >
                  <Search className="w-3 h-3 text-neutral-400" />
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
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="max-w-2xl mx-auto px-4 space-y-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-neutral-100 rounded-2xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-neutral-100 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-100 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded w-1/3" />
                  <div className="h-3 bg-neutral-100 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Results */}
      {hasResults && !loading && (
        <div className="max-w-2xl mx-auto px-4 pb-8">
          {/* Result count + filter */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-600">
              Hasil untuk: <span className="font-semibold text-neutral-900">"{submitted}"</span>
              <span className="text-neutral-400 ml-2 text-xs">{total.toLocaleString()} hasil ditemukan</span>
            </p>
            <button
              onClick={() => setLocation("/search")}
              className="text-xs text-neutral-500 border border-neutral-200 rounded-lg px-2.5 py-1 hover:border-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1"
            >
              Filter <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* AI Summary */}
          {aiSummary && (
            <div className="mb-4 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 leading-relaxed">
              <span className="font-semibold text-neutral-900 mr-1.5">Ringkasan AI</span>
              {aiSummary}
            </div>
          )}

          {/* Paper cards */}
          <div className="space-y-3">
            {results.map((paper) => (
              <article
                key={paper.id}
                className="flex gap-3 border border-neutral-100 rounded-2xl p-4 hover:border-neutral-200 hover:shadow-sm transition-all group"
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-neutral-500" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-semibold text-neutral-900 group-hover:text-blue-700 transition-colors leading-snug mb-0.5"
                  >
                    {paper.title}
                  </a>

                  {/* Authors + year + journal */}
                  <p className="text-xs text-neutral-500 mb-1.5">
                    {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? ", et al." : ""}
                    {paper.year && <> · {paper.year}</>}
                    {paper.journal && <> · <span className="italic">{paper.journal}</span></>}
                  </p>

                  {/* Abstract */}
                  {paper.abstract && (
                    <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2 mb-2">
                      {paper.abstract}
                    </p>
                  )}

                  {/* Bottom row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {paper.citationCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <Quote className="w-3 h-3" />
                        {paper.citationCount.toLocaleString()} sitasi
                      </span>
                    )}
                    {paper.isOpenAccess && (
                      <span className="text-[10px] px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-full font-medium">
                        Open Access
                      </span>
                    )}
                    {paper.pdfUrl && (
                      <a
                        href={paper.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <BookOpen className="w-3 h-3" />
                        PDF Tersedia
                      </a>
                    )}

                    {/* Right-side actions */}
                    <div className="ml-auto flex items-center gap-3">
                      <button className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
                        <Bookmark className="w-3 h-3" />
                        Simpan
                      </button>
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* See more */}
          {total > results.length && (
            <div className="text-center mt-5">
              <button
                onClick={() => setLocation("/search")}
                className="text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-xl px-5 py-2.5 hover:border-neutral-400 transition-colors"
              >
                Lihat semua hasil di Pencarian Semantik →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Module feature cards — always shown when not searching */}
      {!hasResults && !loading && (
        <div className="max-w-2xl mx-auto px-4 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.href}
                  onClick={() => setLocation(mod.href)}
                  className="text-left border border-neutral-100 rounded-2xl p-5 hover:border-neutral-200 hover:shadow-sm transition-all group"
                >
                  {/* Preview */}
                  <div className="mb-4">{mod.preview}</div>

                  {/* Icon + Label */}
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${mod.color} ring-1 ${mod.ringColor}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-sm text-neutral-900">{mod.label}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-neutral-500 leading-relaxed mb-3">{mod.description}</p>

                  {/* CTA */}
                  <div className="flex items-center gap-1 text-xs font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                    Pelajari selengkapnya
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
