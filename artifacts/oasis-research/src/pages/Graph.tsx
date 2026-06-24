import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import { useExploreGraph } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function GraphPage() {
  const [concept, setConcept] = useState("");
  const exploreMutation = useExploreGraph();

  const handleExplore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;
    exploreMutation.mutate({ data: { concept } });
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-between z-10">
          <div>
            <h1 className="text-xl font-semibold">Knowledge Graph</h1>
            <p className="text-sm text-neutral-500">Visualize concepts, methods, and their relationships.</p>
          </div>
          <form onSubmit={handleExplore} className="flex space-x-2 w-96">
            <Input 
              value={concept}
              onChange={e => setConcept(e.target.value)}
              placeholder="Enter a concept (e.g. Transformers)..." 
              className="bg-neutral-50 dark:bg-neutral-900"
            />
            <Button type="submit" disabled={exploreMutation.isPending}>Explore</Button>
          </form>
        </div>

        <div className="flex-1 relative bg-neutral-50 dark:bg-[#0a0a0a] overflow-hidden flex">
          {exploreMutation.isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm z-20">
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium">Synthesizing relationships...</p>
              </div>
            </div>
          )}

          {!exploreMutation.data && !exploreMutation.isPending && (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
              Search a concept to generate its knowledge graph
            </div>
          )}

          {exploreMutation.data && (
            <>
              {/* Fake Graph Visualization area for demo purposes */}
              <div className="flex-1 relative">
                {/* Simulated Nodes/Edges */}
                <svg className="w-full h-full">
                  <defs>
                    <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4b5563" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#4b5563" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  {exploreMutation.data.edges.map((edge, i) => {
                    // Random positions for fake visualization
                    const x1 = 300 + Math.random() * 400;
                    const y1 = 200 + Math.random() * 300;
                    const x2 = 300 + Math.random() * 400;
                    const y2 = 200 + Math.random() * 300;
                    return (
                      <g key={i}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#edge-grad)" strokeWidth="1.5" />
                        <text x={(x1+x2)/2} y={(y1+y2)/2} fill="#6b7280" fontSize="10" textAnchor="middle">{edge.relationship}</text>
                      </g>
                    );
                  })}
                  {exploreMutation.data.nodes.map((node, i) => {
                    const cx = 300 + Math.random() * 400;
                    const cy = 200 + Math.random() * 300;
                    const r = 10 + (node.weight * 10);
                    const color = node.type === 'concept' ? '#3b82f6' : node.type === 'method' ? '#10b981' : '#f59e0b';
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
                        <text x={cx} y={cy + r + 15} fill="currentColor" fontSize="12" textAnchor="middle" fontWeight="500">{node.label}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Side Panel for info */}
              <div className="w-80 border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 overflow-y-auto z-10">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">Graph Insights</h3>
                {exploreMutation.data.insights && (
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-8 leading-relaxed">
                    {exploreMutation.data.insights}
                  </p>
                )}
                
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4">Nodes Overview</h3>
                <div className="space-y-4">
                  {exploreMutation.data.nodes.map(node => (
                    <div key={node.id} className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{node.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 capitalize">{node.type}</span>
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-2">{node.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}