import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import { useGetTrendsOverview } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { TrendingUp, ArrowUpRight, Flame, Zap, BookOpen, Star } from "lucide-react";

const FIELD_PILLS = [
  { label: "All Fields", value: "" },
  { label: "Artificial Intelligence", value: "cs.AI" },
  { label: "Machine Learning", value: "cs.LG" },
  { label: "Computer Vision", value: "cs.CV" },
  { label: "NLP", value: "cs.CL" },
  { label: "Computational Biology", value: "q-bio" },
  { label: "Physics", value: "physics" },
  { label: "Mathematics", value: "math" },
];

const HOT_TOPICS = [
  { name: "Large Language Models", field: "cs.CL", growth: 342, papers: 18420, heat: "hot" },
  { name: "Diffusion Models", field: "cs.CV", growth: 287, papers: 9340, heat: "hot" },
  { name: "Protein Structure Prediction", field: "q-bio.BM", growth: 198, papers: 4210, heat: "rising" },
  { name: "Quantum Error Correction", field: "quant-ph", growth: 167, papers: 2870, heat: "rising" },
  { name: "RLHF & Alignment", field: "cs.AI", growth: 156, papers: 3150, heat: "rising" },
  { name: "Multimodal Models", field: "cs.CV", growth: 143, papers: 5620, heat: "rising" },
  { name: "Graph Neural Networks", field: "cs.LG", growth: 121, papers: 6780, heat: "stable" },
  { name: "Neural Architecture Search", field: "cs.NE", growth: 89, papers: 2430, heat: "stable" },
];

const TREND_FIELDS = [
  { name: "Artificial Intelligence", papers: 42800, novelty: 94, color: "#22d3ee" },
  { name: "Neuroscience", papers: 31200, novelty: 87, color: "#a78bfa" },
  { name: "Computational Biology", papers: 28700, novelty: 83, color: "#34d399" },
  { name: "Quantum Physics", papers: 19300, novelty: 79, color: "#fbbf24" },
  { name: "Materials Science", papers: 16800, novelty: 72, color: "#f87171" },
  { name: "Environmental Science", papers: 14200, novelty: 68, color: "#38bdf8" },
];

const VOLUME_DATA = [
  { year: "2018", ai: 12000, bio: 18000, physics: 14000 },
  { year: "2019", ai: 16500, bio: 19200, physics: 14800 },
  { year: "2020", ai: 22000, bio: 21000, physics: 15200 },
  { year: "2021", ai: 31000, bio: 24500, physics: 16000 },
  { year: "2022", ai: 46000, bio: 27000, physics: 16800 },
  { year: "2023", ai: 68000, bio: 29800, physics: 17500 },
  { year: "2024", ai: 98000, bio: 33000, physics: 18200 },
  { year: "2025", ai: 124000, bio: 36500, physics: 19000 },
];

export default function TrendsPage() {
  const [selectedField, setSelectedField] = useState("");
  const { data: trends, isLoading } = useGetTrendsOverview({ field: selectedField });

  const heatBadge = (heat: string) => {
    if (heat === "hot") return "bg-red-500/10 border-red-500/20 text-red-400";
    if (heat === "rising") return "bg-orange-500/10 border-orange-500/20 text-orange-400";
    return "bg-sky-500/10 border-sky-500/20 text-sky-400";
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">Research Novelty Trends</h1>
          <p className="text-neutral-500 text-sm">Monitor research field growth speed and rising topics from ArXiv.</p>
        </div>

        {/* Field Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FIELD_PILLS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedField(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedField === f.value
                  ? "bg-white text-black"
                  : "bg-white/5 border border-white/8 text-neutral-500 hover:bg-white/8 hover:text-neutral-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BookOpen, label: "ArXiv Papers 2025", value: "2.4M+", color: "text-sky-400" },
            { icon: TrendingUp, label: "YoY Growth", value: "+38%", color: "text-emerald-400" },
            { icon: Flame, label: "New Hot Topics", value: "127", color: "text-red-400" },
            { icon: Star, label: "High-Impact Papers", value: "8,340", color: "text-amber-400" },
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-2xl border border-white/6 bg-white/2">
              <stat.icon className={`w-5 h-5 mb-3 ${stat.color}`} />
              <div className="text-2xl font-black text-white mb-1 font-mono">{stat.value}</div>
              <div className="text-xs text-neutral-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Publication Volume Chart */}
        <div className="p-6 rounded-2xl border border-white/6 bg-white/2 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-400" />
                Publication Volume by Year
              </h2>
              <p className="text-xs text-neutral-600 mt-1">Number of papers uploaded to ArXiv per field</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VOLUME_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="year" stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#e2e8f0", borderRadius: "12px", fontSize: 12 }}
                  formatter={(value: number) => [value.toLocaleString(), ""]}
                />
                <Area type="monotone" dataKey="ai" name="Artificial Intelligence" stroke="#22d3ee" strokeWidth={2.5} fill="url(#colorAi)" />
                <Area type="monotone" dataKey="bio" name="Biology" stroke="#34d399" strokeWidth={2.5} fill="url(#colorBio)" />
                <Area type="monotone" dataKey="physics" name="Physics" stroke="#fbbf24" strokeWidth={2} fill="none" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-4 text-xs text-neutral-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-sky-400 rounded inline-block" /> AI</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-emerald-400 rounded inline-block" /> Biology</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-amber-400 rounded inline-block" /> Physics</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Hot Topics */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Flame className="w-4 h-4 text-orange-400" /> Rising Topics
            </h3>
            <div className="space-y-2">
              {HOT_TOPICS.map((topic, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/6 bg-white/2 hover:border-white/12 hover:bg-white/3 transition-all flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-neutral-200 text-sm truncate">{topic.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold flex-shrink-0 ${heatBadge(topic.heat)}`}>
                        {topic.heat}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600">{topic.field} · <span className="font-mono">{topic.papers.toLocaleString()}</span> papers</p>
                  </div>
                  <div className="flex items-center text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 px-3 py-1.5 rounded-lg ml-3 flex-shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                    <span className="font-black text-sm font-mono">+{topic.growth}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Novelty Score Bar */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Zap className="w-4 h-4 text-sky-400" /> Novelty Score by Field
            </h3>
            <div className="p-5 rounded-xl border border-white/6 bg-white/2 mb-4">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TREND_FIELDS} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "#475569", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} width={130} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px", fontSize: 12, color: "#e2e8f0" }}
                      formatter={(v: number) => [`${v}/100`, "Novelty Score"]}
                    />
                    <Bar dataKey="novelty" radius={[0, 6, 6, 0]}>
                      {TREND_FIELDS.map((entry, i) => (
                        <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-2">
              {TREND_FIELDS.map((field, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/2 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: field.color }} />
                    <span className="text-sm font-medium text-neutral-400">{field.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-600">
                    <span className="font-mono">{field.papers.toLocaleString()}</span>
                    <span className="font-bold font-mono" style={{ color: field.color }}>{field.novelty}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl bg-white/4" />
          </div>
        )}
        {trends?.risingTopics && trends.risingTopics.length > 0 && (
          <div className="p-6 rounded-2xl border border-white/6 bg-white/2">
            <h3 className="text-base font-bold text-white mb-4">Latest Topics (Real-time Data)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {trends.risingTopics.slice(0, 6).map((topic, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/3 border border-white/8">
                  <p className="font-semibold text-sm text-neutral-300 mb-1">{topic.name}</p>
                  <p className="text-xs text-neutral-600">{topic.field} · +{topic.growth}%</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
