import React, { useState, useRef, useCallback, useEffect } from "react";
import MainLayout from "../components/MainLayout";
import { useExploreGraph } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Network, ZoomIn, ZoomOut, RotateCcw, Info, PanelRightClose, PanelRightOpen, Sparkles,
} from "lucide-react";

// ── Dark-theme node colors with glow ──────────────────────────────────────────
const TYPE_COLOR: Record<string, { fill: string; stroke: string; text: string; glow: string }> = {
  concept: { fill: "rgba(59,130,246,0.18)",  stroke: "#3b82f6", text: "#93c5fd", glow: "rgba(59,130,246,0.5)"  },
  method:  { fill: "rgba(16,185,129,0.18)",  stroke: "#10b981", text: "#6ee7b7", glow: "rgba(16,185,129,0.5)"  },
  dataset: { fill: "rgba(245,158,11,0.18)",  stroke: "#f59e0b", text: "#fcd34d", glow: "rgba(245,158,11,0.5)"  },
  person:  { fill: "rgba(236,72,153,0.18)",  stroke: "#ec4899", text: "#f9a8d4", glow: "rgba(236,72,153,0.5)"  },
  paper:   { fill: "rgba(139,92,246,0.18)",  stroke: "#8b5cf6", text: "#c4b5fd", glow: "rgba(139,92,246,0.5)"  },
  default: { fill: "rgba(100,116,139,0.18)", stroke: "#64748b", text: "#94a3b8", glow: "rgba(100,116,139,0.4)" },
};

const QUICK_TOPICS = ["Transformer", "CRISPR", "AlphaFold", "Reinforcement Learning", "Computer Vision", "mRNA Vaccine", "Quantum Computing"];

interface NodeData { id: string; label: string; type: string; description: string; weight: number }
interface NodePos extends NodeData { x: number; y: number }
interface EdgePos { from: string; to: string; rel: string; x1: number; y1: number; x2: number; y2: number }

function layoutGraph(
  nodes: NodeData[],
  edges: { source: string; target: string; relationship: string }[],
) {
  const cx = 500, cy = 360;
  const nodeMap = new Map<string, NodePos>();
  if (!nodes.length) return { nodePosArr: [], edgePosArr: [] };

  const center = nodes.reduce((best, n) => (n.weight > best.weight ? n : best), nodes[0]);
  nodeMap.set(center.id, { ...center, x: cx, y: cy });

  const rest = nodes.filter((n) => n.id !== center.id);
  [rest.slice(0, Math.min(6, rest.length)), rest.slice(6)].forEach((ring, ri) => {
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
    const to   = nodeMap.get(e.target);
    if (from && to)
      edgePosArr.push({ from: e.source, to: e.target, rel: e.relationship, x1: from.x, y1: from.y, x2: to.x, y2: to.y });
  });
  return { nodePosArr, edgePosArr };
}

export default function GraphPage() {
  const [concept, setConcept]           = useState("");
  const [selected, setSelected]         = useState<NodePos | null>(null);
  const [zoom, setZoom]                 = useState(1);
  const [pan, setPan]                   = useState({ x: 0, y: 0 });
  const [showPanel, setShowPanel]       = useState(true);

  // ── Pan state ──
  const isPanning     = useRef(false);
  const panStart      = useRef({ x: 0, y: 0 });

  // ── Per-node drag state ──
  const draggingNode  = useRef<string | null>(null);
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const dragNodeStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const exploreMutation = useExploreGraph();

  // reset offsets when new graph loads
  useEffect(() => { setNodeOffsets({}); setSelected(null); }, [exploreMutation.data]);

  const handleExplore = (e: React.FormEvent) => {
    e.preventDefault();
    const q = concept.trim();
    if (!q) return;
    setZoom(1); setPan({ x: 0, y: 0 });
    exploreMutation.mutate({ data: { concept: q } });
  };

  // ── Mouse events on SVG ────────────────────────────────────────────────────
  const svgMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    // Check if a node was clicked (handled separately via data-node-id)
    if ((e.target as SVGElement).closest("[data-draggable-node]")) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [pan]);

  const svgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNode.current !== null) {
      const dx = (e.clientX - dragNodeStart.current.mx) / zoom;
      const dy = (e.clientY - dragNodeStart.current.my) / zoom;
      setNodeOffsets((prev) => ({
        ...prev,
        [draggingNode.current!]: {
          x: dragNodeStart.current.ox + dx,
          y: dragNodeStart.current.oy + dy,
        },
      }));
      return;
    }
    if (isPanning.current) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    }
  }, [zoom]);

  const svgMouseUp = useCallback(() => {
    isPanning.current = false;
    draggingNode.current = null;
  }, []);

  const svgWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.35, Math.min(3, z - e.deltaY * 0.001)));
  }, []);

  // ── Node drag start ────────────────────────────────────────────────────────
  const nodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    draggingNode.current = nodeId;
    dragNodeStart.current = {
      mx: e.clientX,
      my: e.clientY,
      ox: nodeOffsets[nodeId]?.x ?? 0,
      oy: nodeOffsets[nodeId]?.y ?? 0,
    };
  }, [nodeOffsets]);

  const graph = exploreMutation.data
    ? layoutGraph(exploreMutation.data.nodes ?? [], exploreMutation.data.edges ?? [])
    : null;

  const getPos = (node: NodePos) => ({
    x: node.x + (nodeOffsets[node.id]?.x ?? 0),
    y: node.y + (nodeOffsets[node.id]?.y ?? 0),
  });

  return (
    <MainLayout>
      <div className="flex flex-col h-full bg-[#04040a]">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07] z-10 flex-shrink-0"
          style={{ background: "rgba(9,9,15,0.9)", backdropFilter: "blur(16px)" }}>
          <div>
            <h1 className="text-sm font-semibold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-emerald-400" /> Knowledge Graph
            </h1>
            <p className="text-[11px] text-neutral-600 mt-0.5">Drag nodes · scroll to zoom · pan to explore</p>
          </div>
          <form onSubmit={handleExplore} className="flex gap-2 w-[360px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
              <Input value={concept} onChange={(e) => setConcept(e.target.value)}
                placeholder="Enter concept (e.g. Transformer, CRISPR)…"
                className="pl-8 rounded-xl text-sm h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40" />
            </div>
            <Button type="submit" disabled={exploreMutation.isPending}
              className="rounded-xl h-9 text-xs px-4 bg-emerald-600 hover:bg-emerald-500 text-white border-0">
              {exploreMutation.isPending ? "…" : "Explore"}
            </Button>
          </form>
        </div>

        {/* ── Quick topics ── */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-white/[0.04] overflow-x-auto flex-shrink-0">
          <span className="text-[10px] text-neutral-700 font-medium flex-shrink-0 tracking-wider">QUICK:</span>
          {QUICK_TOPICS.map((t) => (
            <button key={t} onClick={() => { setConcept(t); setZoom(1); setPan({ x: 0, y: 0 }); exploreMutation.mutate({ data: { concept: t } }); }}
              className="flex-shrink-0 text-[11px] px-3 py-1 rounded-full border border-white/[0.08] text-neutral-500 hover:text-white hover:border-white/20 transition-all bg-white/[0.02] hover:bg-white/[0.05]">
              {t}
            </button>
          ))}
        </div>

        {/* ── Canvas ── */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 relative overflow-hidden">

            {/* Zoom + panel toggle controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
              {[
                { icon: PanelRightClose, label: "Toggle panel", action: () => setShowPanel((v) => !v), active: !showPanel },
                { icon: showPanel ? PanelRightClose : PanelRightOpen, label: "Toggle panel", action: () => setShowPanel((v) => !v) },
              ].slice(0, 0)}
              <button onClick={() => setShowPanel((v) => !v)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: showPanel ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${showPanel ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}` }}
                title="Toggle AI panel">
                {showPanel ? <PanelRightClose className="w-3.5 h-3.5 text-emerald-400" /> : <PanelRightOpen className="w-3.5 h-3.5 text-neutral-400" />}
              </button>
              <button onClick={() => setZoom((z) => Math.min(3, z + 0.18))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <ZoomIn className="w-3.5 h-3.5 text-neutral-400" />
              </button>
              <button onClick={() => setZoom((z) => Math.max(0.35, z - 0.18))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <ZoomOut className="w-3.5 h-3.5 text-neutral-400" />
              </button>
              <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setNodeOffsets({}); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <RotateCcw className="w-3 h-3 text-neutral-400" />
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-10 rounded-xl p-3"
              style={{ background: "rgba(9,9,15,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[9px] font-bold text-neutral-600 mb-2 uppercase tracking-[0.18em]">Legend</p>
              {Object.entries(TYPE_COLOR).filter(([k]) => k !== "default").map(([type, c]) => (
                <div key={type} className="flex items-center gap-1.5 mb-1 last:mb-0">
                  <div className="w-2.5 h-2.5 rounded-full border flex-shrink-0"
                    style={{ backgroundColor: c.fill, borderColor: c.stroke }} />
                  <span className="text-[10px] text-neutral-500 capitalize">{type}</span>
                </div>
              ))}
            </div>

            {/* Loading */}
            {exploreMutation.isPending && (
              <div className="absolute inset-0 flex items-center justify-center z-20"
                style={{ background: "rgba(4,4,10,0.7)", backdropFilter: "blur(8px)" }}>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin mx-auto mb-4" />
                  <p className="text-sm font-medium text-neutral-300">Building knowledge graph…</p>
                  <p className="text-xs text-neutral-600 mt-1">Analyzing concept relationships</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!exploreMutation.data && !exploreMutation.isPending && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <Network className="w-10 h-10 text-emerald-500/40" />
                </div>
                <p className="text-sm font-medium text-neutral-500 mb-1">Choose a concept to explore</p>
                <p className="text-xs text-neutral-700">Type above or select a quick topic</p>
              </div>
            )}

            {/* Graph SVG */}
            {graph && (
              <svg ref={svgRef}
                className="w-full h-full select-none"
                style={{ cursor: draggingNode.current ? "grabbing" : "grab" }}
                onMouseDown={svgMouseDown}
                onMouseMove={svgMouseMove}
                onMouseUp={svgMouseUp}
                onMouseLeave={svgMouseUp}
                onWheel={svgWheel}>
                <defs>
                  <marker id="arrow" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
                    <polygon points="0 0,7 2.5,0 5" fill="rgba(100,116,139,0.5)" />
                  </marker>
                  {Object.entries(TYPE_COLOR).map(([type, c]) => (
                    <filter key={type} id={`glow-${type}`} x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feFlood floodColor={c.stroke} floodOpacity="0.6" result="color" />
                      <feComposite in="color" in2="blur" operator="in" result="glow" />
                      <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  ))}
                </defs>

                <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                  {/* Edges — use computed positions */}
                  {graph.edgePosArr.map((edge, i) => {
                    const fromNode = graph.nodePosArr.find((n) => n.id === edge.from);
                    const toNode   = graph.nodePosArr.find((n) => n.id === edge.to);
                    if (!fromNode || !toNode) return null;
                    const fp = getPos(fromNode);
                    const tp = getPos(toNode);
                    const mx = (fp.x + tp.x) / 2;
                    const my = (fp.y + tp.y) / 2;
                    return (
                      <g key={i}>
                        <line x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
                          stroke="rgba(100,116,139,0.25)" strokeWidth="1.2"
                          strokeDasharray="5 4" markerEnd="url(#arrow)" />
                        <text x={mx} y={my - 5} fontSize="8" fill="rgba(100,116,139,0.5)"
                          textAnchor="middle" fontWeight="500">{edge.rel}</text>
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {graph.nodePosArr.map((node) => {
                    const c = TYPE_COLOR[node.type] ?? TYPE_COLOR.default;
                    const r = 26 + node.weight * 20;
                    const isSelected = selected?.id === node.id;
                    const pos = getPos(node);
                    return (
                      <g key={node.id} data-draggable-node="1"
                        className="cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => nodeMouseDown(e, node.id)}
                        onClick={(e) => { e.stopPropagation(); setSelected(isSelected ? null : node); }}>
                        {/* Glow ring */}
                        <circle cx={pos.x} cy={pos.y} r={r + 8} fill={c.glow} opacity={isSelected ? 0.35 : 0.1} />
                        {/* Main circle */}
                        <circle cx={pos.x} cy={pos.y} r={r}
                          fill={c.fill} stroke={c.stroke}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          filter={`url(#glow-${node.type})`}
                          opacity={isSelected ? 1 : 0.85} />
                        {/* Label */}
                        <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
                          fontSize={Math.max(9, 12 - Math.max(0, node.label.length - 8))}
                          fontWeight="700" fill={c.text}>
                          {node.label.length > 14 ? node.label.slice(0, 13) + "…" : node.label}
                        </text>
                        {/* Type badge */}
                        <text x={pos.x} y={pos.y + r + 13} textAnchor="middle"
                          fontSize="8" fill="rgba(148,163,184,0.6)" fontWeight="500" className="capitalize">
                          {node.type}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}
          </div>

          {/* ── Right panel (hideable) ── */}
          {showPanel && (graph || exploreMutation.data?.insights) && (
            <div className="w-68 border-l border-white/[0.06] overflow-y-auto flex-shrink-0 flex flex-col"
              style={{ width: 272, background: "rgba(7,7,14,0.95)", backdropFilter: "blur(16px)" }}>

              {/* AI Insight */}
              {exploreMutation.data?.insights && (
                <div className="p-4 border-b border-white/[0.05]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.16em]">AI Insights</p>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{exploreMutation.data.insights}</p>
                </div>
              )}

              {/* Selected node */}
              {selected && (
                <div className="p-4 border-b border-white/[0.05]"
                  style={{ background: `${(TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).fill}` }}>
                  <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.16em] mb-2">Selected Node</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: (TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).stroke }} />
                    <span className="font-semibold text-sm text-white">{selected.label}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                    style={{ color: (TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).text, border: `1px solid ${(TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).stroke}`, background: (TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).fill }}>
                    {selected.type}
                  </span>
                  {selected.description && (
                    <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">{selected.description}</p>
                  )}
                </div>
              )}

              {/* All nodes */}
              <div className="p-4 flex-1">
                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.16em] mb-3">
                  Nodes ({graph?.nodePosArr.length ?? 0})
                </p>
                <div className="space-y-1.5">
                  {graph?.nodePosArr.map((node) => {
                    const c = TYPE_COLOR[node.type] ?? TYPE_COLOR.default;
                    const isActive = selected?.id === node.id;
                    return (
                      <button key={node.id}
                        onClick={() => setSelected(isActive ? null : node)}
                        className="w-full text-left p-2.5 rounded-xl transition-all"
                        style={{
                          background: isActive ? c.fill : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isActive ? c.stroke : "rgba(255,255,255,0.05)"}`,
                        }}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.stroke }} />
                          <span className="text-xs font-medium text-neutral-300 truncate">{node.label}</span>
                        </div>
                        <p className="text-[10px] text-neutral-600 line-clamp-1 ml-4">{node.description}</p>
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
