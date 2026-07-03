import React, { useEffect, useRef, useState } from "react";
import { useGetCollections, useAddPaperToCollection } from "@workspace/api-client-react";
import {
  ExternalLink,
  BookOpen,
  Bookmark,
  FileText,
  FolderOpen,
  Loader2,
} from "lucide-react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  url?: string;
  pdfUrl?: string;
  abstract?: string;
  journal?: string;
  arxivId?: string;
  doi?: string;
  publishedDate?: string;
  categories?: string[];
  primaryCategory?: string;
  comment?: string;
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : null;
}

/** Save-to-collection dropdown. Renders its own empty/loading/error states — never fabricates collections. */
export function SaveMenu({ paper, onSaved }: { paper: Paper; onSaved: (collectionName: string) => void }) {
  const [open, setOpen] = useState(false);
  const { data: collections, isLoading, isError } = useGetCollections();
  const addToCollection = useAddPaperToCollection();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const handleAdd = (collectionId: string, collectionName: string) => {
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
      },
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
          className="absolute right-0 bottom-full mb-2 w-56 rounded-xl p-1.5 z-20"
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

          {isLoading && (
            <div className="px-2.5 py-4 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-neutral-600 animate-spin" />
            </div>
          )}

          {isError && (
            <div className="px-2.5 py-3 text-xs text-red-400">
              Couldn't load your collections. Try again.
            </div>
          )}

          {!isLoading && !isError && collections && collections.length > 0 && (
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
          )}

          {!isLoading && !isError && (!collections || collections.length === 0) && (
            <div className="px-2.5 py-3 text-xs text-neutral-600">
              No collections yet — create one on the Collections page first.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Compact paper result card — used in Home's quick-search results and Search's full results list. */
export function PaperCard({
  paper,
  index = 0,
  onSaved,
}: {
  paper: Paper;
  index?: number;
  onSaved: (name: string) => void;
}) {
  return (
    <article
      data-testid={`card-paper-${paper.id}`}
      className="flex gap-3 rounded-2xl p-4 group transition-all"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(10px)",
        animation: `onyx-fade-up 0.5s ${EASE} both`,
        animationDelay: `${Math.min(index, 8) * 45}ms`,
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
          {paper.authors?.slice(0, 3).join(", ")}
          {paper.authors && paper.authors.length > 3 ? ", et al." : ""}
          {paper.publishedDate && <> · {fmtDate(paper.publishedDate)}</>}
          {paper.journal && (
            <>
              {" "}
              · <span className="italic">{paper.journal}</span>
            </>
          )}
        </p>
        {paper.abstract && (
          <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2 mb-2">{paper.abstract}</p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          {paper.arxivId && (
            <span className="flex items-center gap-1 text-xs text-neutral-600">
              <BookOpen className="w-3 h-3" />
              arXiv:{paper.arxivId}
            </span>
          )}
          {paper.pdfUrl && (
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-400 transition-colors"
            >
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
