import React, { useState, useRef, useCallback } from "react";
import MainLayout from "../components/MainLayout";
import { useExploreGraph } from "@workspace/api-client-react";
import {
  Search,
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
} from "lucide-react";

const TYPE_COLOR: Record<string, { fill: string; stroke: string; text: string; glow: string }> = {
  concept:  { fill: "#0c2340", stroke: "#22d3ee", text: "#67e8f9", glow: "#22d3ee40" },
  method:   { fill: "#1a0c33", stroke: "#a78bfa", text: "#c4b5fd", glow: "#a78bfa40" },
  dataset:  { fill: "#2a1800", stroke: "#fbbf24", text: "#fcd34d", glow: "#fbbf2440" },
  person:   { fill: "#1a1a1a", stroke: "#94a3b8", text: "#cbd5e1", glow: "#94a3b840" },
  paper:    { fill: "#0c2a1a", stroke: "#34d399", text: "#6ee7b7", glow: "#34d39940" },
  default:  { fill: "#1a1a1a", stroke: "#6b7280", text: "#9ca3af", glow: "#6b728040" },
};

const QUICK_TOPICS = [
  "Transformer",
  "CRISPR",
  "AlphaFold",
  "Reinforcement Learning",
  "Computer Vision",
  "mRNA Vaccine",
  "Quantum Computing",
];

interface NodePos {
  id: string;
  label: string;
  type: string;
  description: string;
  weight: number;
  x: number;
  y: number;
}
interface EdgePos {
  from: string;
  to: string;
  rel: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function layoutGraph(
  nodes: { id: string; label: string; type: string; description: string; weight: number }[],
  edges: { source: string; target: string; relationship: string }[],
) {
  const cx = 500, cy = 350;
  const nodeMap = new Map<string, NodePos>();
  if (!nodes.length) return { nodePosArr: [], edgePosArr: [] };

  const center = nodes.reduce((best, n) => (!best || n.weight > best.weight ? n : best), nodes[0]);
  nodeMap.set(center.id, { ...center, x: cx, y: cy });

  const rest = nodes.filter((n) => n.id !== center.id);
  const rings = [rest.slice(0, Math.min(6, rest.length)), rest.slice(6)];

  rings.forEach((ring, ri) => {
    const r = 170 + ri * 140;
    ring.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / ring.length - Math.PI / 2;
      nodeMap.set(n.id, { ...n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    });
  });

  const nodePosArr = Array.from(nodeMap.values());
  const edgePosArr: EdgePos[] = [];
  edges.forEach((e) => {
    const from = nodeMap.get(e.source);
    const to = nodeMap.get(e.target);
    if (from && to)
      edgePosArr.push({ from: e.source, to: e.target, rel: e.relationship, x1: from.x, y1: from.y, x2: to.x, y2: to.y });
  });

  return { nodePosArr, edgePosArr };
}

export default function GraphPage() {
  const [concept, setConcept] = useState("");
  const [selected, setSelected] = useState<NodePos | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const exploreMutation = useExploreGraph();

  const handleExplore = (e: React.FormEvent) => {
    e.preventDefault();
    const q = concept.trim();
    if (!q) return;
    setSelected(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    exploreMutation.mutate({ data: { concept: q } });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).closest("[data-node]")) return;
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.001)));
  }, []);

  const graph = exploreMutation.data
    ? layoutGraph(exploreMutation.data.nodes ?? [], exploreMutation.data.edges ?? [])
    : null;

  return (
    <MainLayout>
      <div className="flex flex-col h-full bg-[#050505]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#080808] border-b border-white/5 z-10 flex-shrink-0">
          <div>
            <h1 className="text-base font-black text-white flex items-center gap-2 tracking-tight">
              <Network className="w-5 h-5 text-emerald-400" /> Knowledge Graph
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Visualize relationships between concepts, methods, and researchers
            </p>
          </div>
          <form onSubmit={handleExplore} className="flex gap-2 w-[360px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Enter concept (e.g. Transformer, CRISPR)…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/4 text-neutral-200 placeholder:text-neutral-600 text-sm outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={exploreMutation.isPending}
              className="rounded-xl bg-white text-black font-bold text-sm px-5 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
            >
              {exploreMutation.isPending ? "…" : "Explore"}
            </button>
          </form>
        </div>

        {/* Quick topic pills */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-[#080808] border-b border-white/5 overflow-x-auto flex-shrink-0">
          <span className="text-[11px] text-neutral-600 font-medium flex-shrink-0">Quick:</span>
          {QUICK_TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setConcept(t);
                exploreMutation.mutate({ data: { concept: t } });
                setSelected(null);
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="flex-shrink-0 text-xs px-3 py-1 bg-white/4 border border-white/8 hover:bg-white/8 hover:border-white/16 text-neutral-500 hover:text-neutral-200 rounded-full transition-all"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Canvas area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Graph SVG */}
          <div className="flex-1 relative overflow-hidden bg-[#040407]">
            {/* Dot grid background texture */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.8" fill="#334155" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dot-grid)" />
            </svg>

            {/* Zoom controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <ZoomIn className="w-4 h-4 text-neutral-400" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
                className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <ZoomOut className="w-4 h-4 text-neutral-400" />
              </button>
              <button
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-10 bg-[#0a0a0f]/90 backdrop-blur-sm border border-white/8 rounded-xl p-3">
              <p className="text-[9px] font-bold text-neutral-600 mb-2 uppercase tracking-widest">Legend</p>
              {Object.entries(TYPE_COLOR)
                .filter(([k]) => k !== "default")
                .map(([type, c]) => (
                  <div key={type} className="flex items-center gap-1.5 mb-1">
                    <div
                      className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                      style={{ backgroundColor: c.fill, borderColor: c.stroke }}
                    />
                    <span className="text-[10px] text-neutral-500 capitalize">{type}</span>
                  </div>
                ))}
            </div>

            {/* Loading */}
            {exploreMutation.isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium text-neutral-300">Building knowledge graph…</p>
                  <p className="text-xs text-neutral-600 mt-1">Analyzing concept relationships</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!exploreMutation.data && !exploreMutation.isPending && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-700">
                <Network className="w-16 h-16 mb-4 opacity-15" />
                <p className="text-base font-medium mb-1 text-neutral-500">Select a concept to explore</p>
                <p className="text-sm">Type a concept above or choose from the quick list</p>
              </div>
            )}

            {/* Graph */}
            {graph && (
              <svg
                ref={svgRef}
                className="w-full h-full cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#334155" />
                  </marker>
                  {Object.entries(TYPE_COLOR).map(([type, c]) => (
                    <filter key={type} id={`glow-${type}`} x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  ))}
                </defs>

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Edges */}
                  {graph.edgePosArr.map((edge, i) => {
                    const mx = (edge.x1 + edge.x2) / 2;
                    const my = (edge.y1 + edge.y2) / 2;
                    const dx = edge.x2 - edge.x1;
                    const dy = edge.y2 - edge.y1;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const nx = dx / len;
                    const ny = dy / len;
                    const nodeR = 26;
                    return (
                      <g key={i}>
                        <line
                          x1={edge.x1 + nx * nodeR}
                          y1={edge.y1 + ny * nodeR}
                          x2={edge.x2 - nx * (nodeR + 10)}
                          y2={edge.y2 - ny * (nodeR + 10)}
                          stroke="#1e293b"
                          strokeWidth="1.5"
                          markerEnd="url(#arrowhead)"
                        />
                        <text x={mx} y={my - 6} fontSize="8" fill="#334155" textAnchor="middle" fontWeight="600">
                          {edge.rel}
                        </text>
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {graph.nodePosArr.map((node) => {
                    const c = TYPE_COLOR[node.type] ?? TYPE_COLOR.default;
                    const r = 22 + node.weight * 14;
                    const isSelected = selected?.id === node.id;
                    return (
                      <g
                        key={node.id}
                        data-node="1"
                        className="cursor-pointer"
                        onClick={() => setSelected(isSelected ? null : node)}
                        filter={isSelected ? `url(#glow-${node.type})` : undefined}
                      >
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={r + (isSelected ? 5 : 0)}
                          fill={c.fill}
                          stroke={c.stroke}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          opacity={isSelected ? 1 : 0.85}
                        />
                        <text
                          x={node.x}
                          y={node.y + r + 14}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                          fill={c.text}
                          fontFamily="monospace"
                        >
                          {node.label.length > 16 ? node.label.slice(0, 15) + "…" : node.label}
                        </text>
                        <text
                          x={node.x}
                          y={node.y + r + 26}
                          textAnchor="middle"
                          fontSize="8"
                          fill="#475569"
                          fontWeight="500"
                          className="capitalize"
                        >
                          {node.type}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}
          </div>

          {/* Right panel */}
          {(graph || exploreMutation.data?.insights) && (
            <div className="w-64 border-l border-white/5 bg-[#080808] overflow-y-auto flex-shrink-0">
              {/* AI Insight */}
              {exploreMutation.data?.insights && (
                <div className="p-4 border-b border-white/5">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Info className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1.5">AI Insights</p>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{exploreMutation.data.insights}</p>
                </div>
              )}

              {/* Selected node */}
              {selected && (
                <div className="p-4 border-b border-white/5 bg-white/2">
                  <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-2">Selected Node</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                      style={{
                        backgroundColor: (TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).fill,
                        borderColor: (TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).stroke,
                      }}
                    />
                    <span className="font-bold text-sm text-neutral-200">{selected.label}</span>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize"
                    style={{
                      color: (TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).text,
                      borderColor: (TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).stroke,
                      backgroundColor: (TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).fill,
                    }}
                  >
                    {selected.type}
                  </span>
                  {selected.description && (
                    <p className="text-xs text-neutral-500 mt-2 leading-relaxed">{selected.description}</p>
                  )}
                </div>
              )}

              {/* All nodes */}
              <div className="p-4">
                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-3">
                  All Nodes ({graph?.nodePosArr.length ?? 0})
                </p>
                <div className="space-y-2">
                  {graph?.nodePosArr.map((node) => {
                    const c = TYPE_COLOR[node.type] ?? TYPE_COLOR.default;
                    return (
                      <button
                        key={node.id}
                        onClick={() => setSelected(selected?.id === node.id ? null : node)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                          selected?.id === node.id
                            ? "border-white/15 bg-white/5 text-neutral-200"
                            : "border-white/5 hover:border-white/10 hover:bg-white/3 text-neutral-500"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.stroke }} />
                          <span className="text-xs font-medium truncate">{node.label}</span>
                        </div>
                        <p className="text-[10px] text-neutral-700 line-clamp-1 ml-4">{node.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
