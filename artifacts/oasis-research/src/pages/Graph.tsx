import React, { useState, useRef, useCallback } from "react";
import MainLayout from "../components/MainLayout";
import { useExploreGraph } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Network, ZoomIn, ZoomOut, RotateCcw, Info } from "lucide-react";

const TYPE_COLOR: Record<string, { fill: string; stroke: string; text: string }> = {
  concept:  { fill: "#dbeafe", stroke: "#3b82f6", text: "#1e40af" },
  method:   { fill: "#d1fae5", stroke: "#10b981", text: "#065f46" },
  dataset:  { fill: "#fef3c7", stroke: "#f59e0b", text: "#92400e" },
  person:   { fill: "#fce7f3", stroke: "#ec4899", text: "#9d174d" },
  paper:    { fill: "#ede9fe", stroke: "#8b5cf6", text: "#4c1d95" },
  default:  { fill: "#f3f4f6", stroke: "#6b7280", text: "#374151" },
};

const QUICK_TOPICS = [
  "Transformer", "CRISPR", "AlphaFold", "Reinforcement Learning",
  "Computer Vision", "mRNA Vaccine", "Quantum Computing",
];

interface NodePos { id: string; label: string; type: string; description: string; weight: number; x: number; y: number; }
interface EdgePos { from: string; to: string; rel: string; x1: number; y1: number; x2: number; y2: number; }

function layoutGraph(nodes: { id: string; label: string; type: string; description: string; weight: number }[], edges: { source: string; target: string; relationship: string }[]) {
  const cx = 500, cy = 350;
  const nodeMap = new Map<string, NodePos>();
  if (!nodes.length) return { nodePosArr: [], edgePosArr: [] };

  const center = nodes.reduce((best, n) => (!best || n.weight > best.weight) ? n : best, nodes[0]);
  nodeMap.set(center.id, { ...center, x: cx, y: cy });

  const rest = nodes.filter(n => n.id !== center.id);
  const rings = [
    rest.slice(0, Math.min(6, rest.length)),
    rest.slice(6),
  ];

  rings.forEach((ring, ri) => {
    const r = 160 + ri * 130;
    ring.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / ring.length - Math.PI / 2;
      nodeMap.set(n.id, { ...n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    });
  });

  const nodePosArr = Array.from(nodeMap.values());
  const edgePosArr: EdgePos[] = [];
  edges.forEach(e => {
    const from = nodeMap.get(e.source);
    const to = nodeMap.get(e.target);
    if (from && to) edgePosArr.push({ from: e.source, to: e.target, rel: e.relationship, x1: from.x, y1: from.y, x2: to.x, y2: to.y });
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
    setZoom(z => Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.001)));
  }, []);

  const graph = exploreMutation.data
    ? layoutGraph(exploreMutation.data.nodes ?? [], exploreMutation.data.edges ?? [])
    : null;

  return (
    <MainLayout>
      <div className="flex flex-col h-full bg-[#f8f9fb]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200 z-10 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <Network className="w-5 h-5 text-green-600" /> Grafik Pengetahuan
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">Visualisasikan hubungan antar konsep, metode, dan peneliti</p>
          </div>
          <form onSubmit={handleExplore} className="flex gap-2 w-[380px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                value={concept}
                onChange={e => setConcept(e.target.value)}
                placeholder="Masukkan konsep (mis. Transformer, CRISPR)…"
                className="pl-9 rounded-xl border-neutral-200 bg-neutral-50 text-sm"
              />
            </div>
            <Button type="submit" disabled={exploreMutation.isPending} className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-sm px-5">
              {exploreMutation.isPending ? "…" : "Jelajahi"}
            </Button>
          </form>
        </div>

        {/* Quick topic pills */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-white border-b border-neutral-100 overflow-x-auto flex-shrink-0">
          <span className="text-[11px] text-neutral-400 font-medium flex-shrink-0">Cepat:</span>
          {QUICK_TOPICS.map(t => (
            <button
              key={t}
              onClick={() => { setConcept(t); exploreMutation.mutate({ data: { concept: t } }); setSelected(null); setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="flex-shrink-0 text-xs px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Canvas area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Graph SVG */}
          <div className="flex-1 relative overflow-hidden">
            {/* Zoom controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
              <button onClick={() => setZoom(z => Math.min(2.5, z + 0.15))} className="w-8 h-8 bg-white border border-neutral-200 rounded-lg flex items-center justify-center hover:bg-neutral-50 shadow-sm">
                <ZoomIn className="w-4 h-4 text-neutral-600" />
              </button>
              <button onClick={() => setZoom(z => Math.max(0.4, z - 0.15))} className="w-8 h-8 bg-white border border-neutral-200 rounded-lg flex items-center justify-center hover:bg-neutral-50 shadow-sm">
                <ZoomOut className="w-4 h-4 text-neutral-600" />
              </button>
              <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="w-8 h-8 bg-white border border-neutral-200 rounded-lg flex items-center justify-center hover:bg-neutral-50 shadow-sm">
                <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm border border-neutral-200 rounded-xl p-3 shadow-sm">
              <p className="text-[10px] font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Legenda</p>
              {Object.entries(TYPE_COLOR).filter(([k]) => k !== "default").map(([type, c]) => (
                <div key={type} className="flex items-center gap-1.5 mb-1">
                  <div className="w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ backgroundColor: c.fill, borderColor: c.stroke }} />
                  <span className="text-[10px] text-neutral-600 capitalize">{type}</span>
                </div>
              ))}
            </div>

            {/* Loading */}
            {exploreMutation.isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium text-neutral-700">Membangun grafik pengetahuan…</p>
                  <p className="text-xs text-neutral-400 mt-1">Menganalisis hubungan konsep</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!exploreMutation.data && !exploreMutation.isPending && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                <Network className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-base font-medium mb-1">Pilih konsep untuk dijelajahi</p>
                <p className="text-sm">Ketik konsep di atas atau pilih dari daftar cepat</p>
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
                    <polygon points="0 0, 8 3, 0 6" fill="#d1d5db" />
                  </marker>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
                  </filter>
                </defs>

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Edges */}
                  {graph.edgePosArr.map((edge, i) => {
                    const mx = (edge.x1 + edge.x2) / 2;
                    const my = (edge.y1 + edge.y2) / 2;
                    return (
                      <g key={i}>
                        <line
                          x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
                          stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 3"
                          markerEnd="url(#arrowhead)"
                        />
                        <text x={mx} y={my - 5} fontSize="9" fill="#9ca3af" textAnchor="middle" fontWeight="500">
                          {edge.rel}
                        </text>
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {graph.nodePosArr.map((node) => {
                    const c = TYPE_COLOR[node.type] ?? TYPE_COLOR.default;
                    const r = 24 + node.weight * 18;
                    const isSelected = selected?.id === node.id;
                    return (
                      <g
                        key={node.id}
                        data-node="1"
                        className="cursor-pointer"
                        onClick={() => setSelected(isSelected ? null : node)}
                      >
                        <circle
                          cx={node.x} cy={node.y} r={r + (isSelected ? 4 : 0)}
                          fill={c.fill}
                          stroke={c.stroke}
                          strokeWidth={isSelected ? 3 : 1.5}
                          filter="url(#shadow)"
                        />
                        <text
                          x={node.x} y={node.y}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize={Math.max(9, 12 - Math.max(0, node.label.length - 8))}
                          fontWeight="600"
                          fill={c.text}
                        >
                          {node.label.length > 14 ? node.label.slice(0, 13) + "…" : node.label}
                        </text>
                        <text
                          x={node.x} y={node.y + r + 14}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#9ca3af"
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
            <div className="w-72 border-l border-neutral-200 bg-white overflow-y-auto flex-shrink-0">
              {/* AI Insight */}
              {exploreMutation.data?.insights && (
                <div className="p-4 border-b border-neutral-100">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Info className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mt-1">Wawasan AI</p>
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed">{exploreMutation.data.insights}</p>
                </div>
              )}

              {/* Selected node */}
              {selected && (
                <div className="p-4 border-b border-neutral-100 bg-blue-50/50">
                  <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Node Dipilih</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ backgroundColor: (TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).fill, borderColor: (TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).stroke }} />
                    <span className="font-semibold text-sm text-neutral-900">{selected.label}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize" style={{ color: (TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).text, borderColor: (TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).stroke, backgroundColor: (TYPE_COLOR[selected.type] ?? TYPE_COLOR.default).fill }}>
                    {selected.type}
                  </span>
                  {selected.description && (
                    <p className="text-xs text-neutral-600 mt-2 leading-relaxed">{selected.description}</p>
                  )}
                </div>
              )}

              {/* All nodes */}
              <div className="p-4">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                  Semua Node ({graph?.nodePosArr.length ?? 0})
                </p>
                <div className="space-y-2">
                  {graph?.nodePosArr.map(node => {
                    const c = TYPE_COLOR[node.type] ?? TYPE_COLOR.default;
                    return (
                      <button
                        key={node.id}
                        onClick={() => setSelected(selected?.id === node.id ? null : node)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all ${selected?.id === node.id ? "border-blue-300 bg-blue-50" : "border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50"}`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.stroke }} />
                          <span className="text-xs font-medium text-neutral-900 truncate">{node.label}</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-1 ml-4">{node.description}</p>
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
