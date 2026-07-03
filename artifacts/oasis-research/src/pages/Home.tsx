import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import MainLayout from "../components/MainLayout";
import {
  useSemanticSearch,
  useGetTrendingSearches,
  useGetCollections,
  // TODO: verify this hook name against your generated @workspace/api-client-react.
  // It should be whatever mutation adds a paper (by external id/url, since these
  // come from ArXiv, not your own DB) to an existing collection. Common candidates
  // in an orval/openapi-generated client: useAddPaperToCollection, useAddCollectionPaper,
  // useCreateCollectionPaper. Swap the import + mutate() payload below to match.
  useAddPaperToCollection,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  SearchX,
  Clock,
  ArrowUpDown,
  Command,
  Check,
  FolderOpen,
  CalendarDays,
} from "lucide-react";

const FALLBACK_TRENDING = [
  "protein folding",
  "CRISPR cancer",
  "large language models",
  "single-cell RNA",
  "renewable energy",
  "quantum computing",
];

const RECENT_KEY = "onyx:recent-searches";
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"; // Apple-style easeOutExpo

const modules = [
  {
    icon: Search,
    label: "Semantic Search",
    href: "/search",
    accentColor: "text-sky-400",
    bgColor: "bg-sky-400/8",
    borderColor: "border-sky-400/15",
    ring: "rgba(56,189,248,0.35)",
    description: "Find the most relevant papers using natural language and semantic understanding.",
  },
  {
    icon: Sparkles,
    label: "AI Copilot",
    href: "/copilot",
    accentColor: "text-violet-400",
    bgColor: "bg-violet-400/8",
    borderColor: "border-violet-400/15",
    ring: "rgba(167,139,250,0.35)",
    description: "Get AI-generated summaries, synthesis, and answers with real citations from literature.",
  },
  {
    icon: Network,
    label: "Knowledge Graph",
    href: "/graph",
    accentColor: "text-emerald-400",
    bgColor: "bg-emerald-400/8",
    borderColor: "border-emerald-400/15",
    ring: "rgba(52,211,153,0.35)",
    description: "Visualize relationships between papers, authors, concepts, and research fields.",
  },
  {
    icon: Lightbulb,
    label: "Gap Discovery",
    href: "/gaps",
    accentColor: "text-amber-400",
    bgColor: "bg-amber-400/8",
    borderColor: "border-amber-400/15",
    ring: "rgba(251,191,36,0.35)",
    description: "Identify underexplored research areas and discover breakthrough opportunities.",
  },
  {
    icon: TrendingUp,
    label: "Novelty Trends",
    href: "/trends",
    accentColor: "text-orange-400",
    bgColor: "bg-orange-400/8",
    borderColor: "border-orange-400/15",
    ring: "rgba(251,146,60,0.35)",
    description: "Track rising topics and predict the direction of future research.",
  },
  {
    icon: Users,
    label: "Collaborate",
    href: "/collaborate",
    accentColor: "text-pink-400",
    bgColor: "bg-pink-400/8",
    borderColor: "border-pink-400/15",
    ring: "rgba(244,114,182,0.35)",
    description: "Connect with researchers in the same field and manage research projects.",
  },
];

// ---------- small helpers ----------

function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      /* localStorage unavailable — fail silently */
    }
  }, []);

  const push = useCallback((term: string) => {
    setRecent((prev) => {
      const next = [term, ...prev.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const remove = useCallback((term: string) => {
    setRecent((prev) => {
      const next = prev.filter((t) => t !== term);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { recent, push, remove, clear };
}

function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : null;
}

// ---------- subcomponents ----------

function ModuleCard({ mod, index, onOpen }: { mod: (typeof modules)[number]; index: number; onOpen: () => void }) {
  const { ref, visible } = useRevealOnScroll<HTMLButtonElement>();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const Icon = mod.icon;

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (0.5 - py) * 6, y: (px - 0.5) * 6 });
  };

  const reset = () => {
    setHovering(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <button
      ref={ref}
      onClick={onOpen}
      onMouseEnter={() => setHovering(true)}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onFocus={() => setHovering(true)}
      onBlur={reset}
      data-testid={`card-module-${mod.href.slice(1)}`}
      className="relative text-left rounded-2xl p-5 overflow-hidden group active:scale-[0.98]"
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.025)",
        backdropFilter: "blur(12px)",
        opacity: visible ? 1 : 0,
        transform: visible
          ? `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${hovering ? -3 : 0}px)`
          : "translateY(14px)",
        transition: `opacity 0.6s ${EASE}, transform ${hovering ? "80ms linear" : `0.5s ${EASE}`}, border-color 0.25s ${EASE}, background 0.25s ${EASE}`,
        transitionDelay: visible ? `${index * 55}ms` : "0ms",
        boxShadow: hovering ? `0 12px 30px -12px ${mod.ring}` : "none",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }}
      />
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${mod.bgColor} border ${mod.borderColor} transition-transform duration-300`}
        style={{ transform: hovering ? "scale(1.12)" : "scale(1)", transitionTimingFunction: EASE }}
      >
        <Icon className={`w-4 h-4 ${mod.accentColor}`} />
      </div>
      <div className="font-semibold text-sm text-neutral-200 mb-1.5">{mod.label}</div>
      <p className="text-xs text-neutral-600 leading-relaxed mb-3">{mod.description}</p>
      <div className={`flex items-center gap-1 text-xs font-medium ${mod.accentColor} transition-opacity`} style={{ opacity: hovering ? 1 : 0.7 }}>
        Explore
        <ArrowRight className="w-3 h-3 transition-transform" style={{ transform: hovering ? "translateX(2px)" : "translateX(0)", transitionTimingFunction: EASE }} />
      </div>
    </button>
  );
}

function SaveMenu({
  paper,
  onSaved,
}: {
  paper: any;
  onSaved: (collectionName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: collections, isLoading } = useGetCollections();
  const addToCollection = useAddPaperToCollection();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handleAdd = (collectionId: string, collectionName: string) => {
    // TODO: confirm payload shape — this assumes the mutation accepts the
    // collection id plus enough of the paper to persist an external (ArXiv) result.
    addToCollection.mutate(
      {
        collectionId,
        data: {
          title: paper.title,
          authors: paper.authors,
          url: paper.url,
          pdfUrl: paper.pdfUrl,
          abstract: paper.abstract,
        },
      } as any,
      {
        onSuccess: () => {
          setOpen(false);
          onSaved(collectionName);
        },
      }
    );
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        data-testid={`button-save-${paper.id}`}
        className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-300 transition-colors active:scale-90"
        style={{ transitionTimingFunction: EASE }}
      >
        <Bookmark className="w-3 h-3" />
        Save
      </button>

      {open && (
        <div
          className="onyx-fade absolute right-0 bottom-full mb-2 w-56 rounded-xl p-1.5 z-20"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(15,15,18,0.97)",
            backdropFilter: "blur(14px)",
            boxShadow: "0 12px 32px -8px rgba(0,0,0,0.5)",
          }}
        >
          <div className="px-2.5 py-1.5 text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
            Save to collection
          </div>
          {isLoading ? (
            <div className="px-2.5 py-2 space-y-1.5">
              <Skeleton className="h-6 w-full bg-white/6 rounded-lg" />
              <Skeleton className="h-6 w-full bg-white/6 rounded-lg" />
            </div>
          ) : collections && collections.length > 0 ? (
            collections.map((col) => (
              <button
                key={col.id}
                onClick={() => handleAdd(col.id, col.name)}
                disabled={addToCollection.isPending}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-neutral-300 rounded-lg hover:bg-white/6 transition-colors disabled:opacity-40"
              >
                <FolderOpen className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span className="truncate">{col.name}</span>
              </button>
            ))
          ) : (
            <div className="px-2.5 py-3 text-xs text-neutral-600">
              No collections yet — create one on the Collections page first.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ paper, index, onSaved }: { paper: any; index: number; onSaved: (name: string) => void }) {
  const { ref, visible } = useRevealOnScroll<HTMLElement>();
  const publishedDate = paper.publishedDate as string | undefined;
  const arxivId = paper.arxivId as string | undefined;
  const journal = paper.journal as string | undefined;

  return (
    <article
      ref={ref}
      data-testid={`card-paper-${paper.id}`}
      className="flex gap-3 rounded-2xl p-4 group"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(10px)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: `opacity 0.5s ${EASE}, transform 0.5s ${EASE}, border-color 0.25s ${EASE}, background 0.25s ${EASE}`,
        transitionDelay: visible ? `${Math.min(index, 6) * 45}ms` : "0ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
        e.currentTarget.style.background = "rgba(255,255,255,0.035)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
      }}
    >
      <div className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center flex-shrink-0 mt-0.5">
        <FileText className="w-4 h-4 text-neutral-500" />
      </div>
      <div className="flex-1 min-w-0">
        <a
          href={paper.url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-semibold text-neutral-200 group-hover:text-sky-400 transition-colors leading-snug mb-0.5"
        >
          {paper.title}
        </a>
        <p className="text-xs text-neutral-600 mb-1.5">
          {paper.authors?.slice(0, 3).join(", ")}{paper.authors?.length > 3 ? ", et al." : ""}
          {publishedDate && <> · {fmtDate(publishedDate)}</>}
          {journal && <> · <span className="italic">{journal}</span></>}
        </p>
        {paper.abstract && <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2 mb-2">{paper.abstract}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          {arxivId && (
            <span className="flex items-center gap-1 text-xs text-neutral-600">
              <BookOpen className="w-3 h-3" />
              arXiv:{arxivId}
            </span>
          )}
          {paper.pdfUrl && (
            <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-400 transition-colors">
              <FileText className="w-3 h-3" />
              PDF
            </a>
          )}
          <div className="ml-auto flex items-center gap-3">
            <SaveMenu paper={paper} onSaved={onSaved} />
            <a
              href={paper.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open paper in new tab"
              className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function Chip({
  children,
  onClick,
  onRemove,
  icon,
  testId,
}: {
  children: React.ReactNode;
  onClick: () => void;
  onRemove?: () => void;
  icon?: React.ReactNode;
  testId?: string;
}) {
  return (
    <span
      className="flex items-center gap-1.5 text-xs pl-3 pr-1.5 py-1.5 rounded-full text-neutral-500 hover:text-neutral-200 transition-all"
      style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", transitionTimingFunction: EASE }}
    >
      <button onClick={onClick} data-testid={testId} className="flex items-center gap-1.5 active:scale-95" style={{ transitionTimingFunction: EASE }}>
        {icon}
        {children}
      </button>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove "${children}" from recent searches`}
          className="ml-0.5 p-1 rounded-full hover:bg-white/8 hover:text-neutral-200 transition-colors"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

// ---------- main component ----------

export default function Home() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [openAccessOnly, setHasPdfOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "recent">("relevance");
  const [toast, setToast] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { recent, push: pushRecent, remove: removeRecent, clear: clearRecent } = useRecentSearches();

  const searchMutation = useSemanticSearch();
  const { data: trendingData } = useGetTrendingSearches();
  const trending = trendingData && trendingData.length > 0 ? trendingData.slice(0, 6).map((t) => t.query) : FALLBACK_TRENDING;

  // Pick up ?q= for deep links (e.g. from the sitewide search shortcut). Note:
  // Search.tsx doesn't currently read this param on its own — see the patch note.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setQuery(q);
      runSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        inputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const runSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || searchMutation.isPending) return;
    setSearched(true);
    setHasPdfOnly(false);
    setSortBy("relevance");
    searchMutation.mutate(
      { data: { query: trimmed } },
      { onSuccess: () => pushRecent(trimmed) }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const clearSearch = () => {
    setQuery("");
    setSearched(false);
    searchMutation.reset();
    inputRef.current?.focus();
  };

  const goToFullSearch = () => {
    const q = searchMutation.data?.query ?? query;
    setLocation(`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);
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

  const loading = searchMutation.isPending;
  const hasResults = displayedResults.length > 0 || rawResults.length > 0;
  const noResults = searched && !loading && !searchMutation.isError && rawResults.length === 0;

  return (
    <MainLayout>
      <style>{`
        @keyframes onyx-drift-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(3%, -4%) scale(1.08); } }
        @keyframes onyx-drift-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-4%, 3%) scale(1.05); } }
        @keyframes onyx-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes onyx-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes onyx-toast-in { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .onyx-appear { animation: onyx-fade-up 0.6s ${EASE} both; }
        .onyx-fade { animation: onyx-fade-in 0.5s ${EASE} both; }
        .onyx-toast { animation: onyx-toast-in 0.4s ${EASE} both; }
        @media (prefers-reduced-motion: reduce) {
          .onyx-appear, .onyx-fade, .onyx-toast, .onyx-orb-a, .onyx-orb-b { animation: none !important; }
        }
      `}</style>

      <div
        className="onyx-orb-a pointer-events-none fixed -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full opacity-[0.14] blur-[110px] z-0"
        style={{ background: "radial-gradient(circle, #38bdf8 0%, #8b5cf6 45%, transparent 70%)", animation: "onyx-drift-a 16s ease-in-out infinite" }}
      />
      <div
        className="onyx-orb-b pointer-events-none fixed top-40 right-0 w-[420px] h-[420px] rounded-full opacity-[0.08] blur-[100px] z-0"
        style={{ background: "radial-gradient(circle, #f472b6 0%, #fb923c 50%, transparent 70%)", animation: "onyx-drift-b 20s ease-in-out infinite" }}
      />

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

      <div className="relative z-10 max-w-2xl mx-auto p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight tracking-tight onyx-appear">
          Advanced Tools for<br />Breakthrough Research
        </h1>
        <p className="text-neutral-500 text-sm mb-5 leading-relaxed onyx-appear" style={{ animationDelay: "60ms" }}>
          Search millions of papers, understand key findings,<br className="hidden md:block" />
          and discover research gaps with AI.
        </p>

        <form onSubmit={handleSubmit} className="onyx-appear" style={{ animationDelay: "120ms" }}>
          <div
            className="flex items-center rounded-2xl px-4 py-3"
            style={{
              border: focused ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.035)",
              backdropFilter: "blur(10px)",
              boxShadow: focused ? "0 0 0 4px rgba(56,189,248,0.08)" : "none",
              transition: `border-color 0.25s ${EASE}, box-shadow 0.25s ${EASE}`,
            }}
          >
            <Search className="w-4 h-4 text-neutral-600 flex-shrink-0 mr-3" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              data-testid="input-home-search"
              className="flex-1 bg-transparent text-sm outline-none text-neutral-100 placeholder:text-neutral-600"
              placeholder="Search papers, concepts, methods, researchers..."
              aria-label="Search papers, concepts, methods, researchers"
            />
            {query ? (
              <button type="button" onClick={clearSearch} aria-label="Clear search" className="text-neutral-600 hover:text-neutral-300 mx-1 transition-colors active:scale-90" style={{ transitionTimingFunction: EASE }}>
                <X className="w-4 h-4" />
              </button>
            ) : (
              !focused && (
                <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-neutral-700 border border-white/8 rounded-md px-1.5 py-0.5 mr-1">
                  <Command className="w-2.5 h-2.5" />K
                </span>
              )
            )}
            <Button
              type="submit"
              disabled={!query.trim() || loading}
              data-testid="button-home-search"
              className="ml-2 rounded-xl bg-white text-black font-bold hover:bg-neutral-100 disabled:opacity-30 flex-shrink-0"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
            </Button>
          </div>
        </form>

        {!hasResults && !loading && !searched && (
          <div className="mt-4 space-y-3 onyx-appear" style={{ animationDelay: "180ms" }}>
            {recent.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-neutral-600">Recent</p>
                  <button onClick={clearRecent} className="text-[11px] text-neutral-700 hover:text-neutral-400 transition-colors">Clear</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((t) => (
                    <Chip key={t} onClick={() => { setQuery(t); runSearch(t); }} onRemove={() => removeRecent(t)} icon={<Clock className="w-3 h-3 text-neutral-600" />}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-neutral-600 mb-2">Try popular searches</p>
              <div className="flex flex-wrap gap-2">
                {trending.map((t, i) => (
                  <Chip key={t} testId={`chip-trending-${i}`} onClick={() => { setQuery(t); runSearch(t); }} icon={<Search className="w-3 h-3 text-neutral-600" />}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {searchMutation.isError && (
        <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-8 mb-4 onyx-appear">
          <div className="text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
            Search failed. Please try again.
          </div>
        </div>
      )}

      {loading && (
        <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-8 space-y-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-white/6 rounded-2xl p-4 onyx-fade" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex gap-3">
                <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0 bg-white/6" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-white/6" />
                  <Skeleton className="h-3 w-1/3 bg-white/4" />
                  <Skeleton className="h-3 w-full bg-white/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {noResults && (
        <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-8 pb-10 onyx-appear">
          <div className="flex flex-col items-center text-center border border-white/6 rounded-2xl px-6 py-10">
            <div className="w-11 h-11 rounded-2xl bg-white/6 flex items-center justify-center mb-4">
              <SearchX className="w-5 h-5 text-neutral-500" />
            </div>
            <p className="text-sm font-semibold text-neutral-200 mb-1">No results for "{searchMutation.data?.query}"</p>
            <p className="text-xs text-neutral-600 max-w-xs leading-relaxed">
              Try a broader term, check for typos, or search by author or concept instead.
            </p>
          </div>
        </div>
      )}

      {hasResults && !loading && searchMutation.data && (
        <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-8 pb-8">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2 onyx-appear">
            <p className="text-sm text-neutral-500">
              Results for: <span className="font-semibold text-neutral-200">"{searchMutation.data.query}"</span>
              <span className="text-neutral-600 ml-2 text-xs">{searchMutation.data.total.toLocaleString()} found</span>
            </p>
            <button
              onClick={goToFullSearch}
              data-testid="button-open-full-search"
              className="text-xs text-neutral-500 border border-white/8 rounded-lg px-2.5 py-1 hover:border-white/20 hover:text-neutral-200 transition-all flex items-center gap-1 active:scale-95"
              style={{ transitionTimingFunction: EASE }}
            >
              Filter <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4 onyx-appear" style={{ animationDelay: "30ms" }}>
            <button
              onClick={() => setHasPdfOnly((v) => !v)}
              aria-pressed={openAccessOnly}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all active:scale-95"
              style={{
                border: openAccessOnly ? "1px solid rgba(56,189,248,0.4)" : "1px solid rgba(255,255,255,0.08)",
                background: openAccessOnly ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.02)",
                color: openAccessOnly ? "#38bdf8" : "rgb(115,115,115)",
                transitionTimingFunction: EASE,
              }}
            >
              <FileText className="w-3 h-3" />
              Has PDF
            </button>
            <button
              onClick={() => setSortBy((s) => (s === "relevance" ? "recent" : "relevance"))}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-neutral-500 hover:text-neutral-200 transition-all active:scale-95 ml-auto"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", transitionTimingFunction: EASE }}
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortBy === "relevance" ? "Relevance" : "Most recent"}
            </button>
          </div>

          {searchMutation.data.aiSummary && (
            <div className="mb-4 px-4 py-3 bg-violet-500/6 border border-violet-500/15 rounded-xl text-sm text-neutral-300 leading-relaxed onyx-appear" style={{ animationDelay: "40ms" }}>
              <span className="font-semibold text-violet-400 mr-1.5">AI Summary</span>
              {searchMutation.data.aiSummary}
            </div>
          )}

          {displayedResults.length === 0 ? (
            <div className="text-center text-xs text-neutral-600 border border-white/6 rounded-2xl py-8 onyx-fade">
              Nothing matches this filter — try turning "Has PDF" off.
            </div>
          ) : (
            <div className="space-y-3">
              {displayedResults.map((paper: any, i: number) => (
                <ResultCard key={paper.id} paper={paper} index={i} onSaved={(name) => showToast(`Saved to "${name}"`)} />
              ))}
            </div>
          )}

          {searchMutation.data.total > rawResults.length && (
            <div className="text-center mt-5 onyx-appear">
              <button
                onClick={goToFullSearch}
                className="text-sm text-neutral-500 hover:text-neutral-200 border border-white/8 rounded-xl px-5 py-2.5 hover:border-white/20 transition-all active:scale-[0.97]"
                style={{ transitionTimingFunction: EASE }}
              >
                View all results in Semantic Search →
              </button>
            </div>
          )}
        </div>
      )}

      {!hasResults && !loading && !searched && (
        <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-8 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modules.map((mod, i) => (
              <ModuleCard key={mod.href} mod={mod} index={i} onOpen={() => setLocation(mod.href)} />
            ))}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
