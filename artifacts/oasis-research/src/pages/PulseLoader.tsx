import React from "react";

/**
 * Loading placeholder for paper-card lists. Mirrors the actual shape of a
 * PaperCard (icon + title + meta + abstract lines) so the layout doesn't
 * jump when real data arrives, but is a purpose-built component rather
 * than a generic dummy-box skeleton.
 */
export function PaperCardPulse({ delayMs = 0 }: { delayMs?: number }) {
  return (
    <div
      className="flex gap-3 rounded-2xl p-4"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        animation: `onyx-pulse 1.6s ease-in-out ${delayMs}ms infinite`,
      }}
    >
      <div className="w-9 h-9 rounded-xl bg-white/8 flex-shrink-0" />
      <div className="flex-1 space-y-2.5 py-0.5">
        <div className="h-3.5 w-3/4 rounded bg-white/8" />
        <div className="h-2.5 w-1/3 rounded bg-white/6" />
        <div className="h-2.5 w-full rounded bg-white/5" />
        <div className="h-2.5 w-5/6 rounded bg-white/5" />
      </div>
    </div>
  );
}

export function PaperListPulse({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      <style>{`
        @keyframes onyx-pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="onyx-pulse"] { animation: none !important; opacity: 0.75 !important; }
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <PaperCardPulse key={i} delayMs={i * 120} />
      ))}
    </div>
  );
}
