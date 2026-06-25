import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import { useGetTrendsOverview } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { TrendingUp, ArrowUpRight, Flame, Zap, BookOpen, Star } from "lucide-react";

const FIELD_PILLS = [
  { label: "Semua Bidang", value: "" },
  { label: "Kecerdasan Buatan", value: "cs.AI" },
  { label: "Pembelajaran Mesin", value: "cs.LG" },
  { label: "Visi Komputer", value: "cs.CV" },
  { label: "NLP", value: "cs.CL" },
  { label: "Biologi Komputasi", value: "q-bio" },
  { label: "Fisika", value: "physics" },
  { label: "Matematika", value: "math" },
];

const HOT_TOPICS = [
  { name: "Large Language Models", field: "cs.CL", growth: 342, papers: 18420, heat: "panas" },
  { name: "Diffusion Models", field: "cs.CV", growth: 287, papers: 9340, heat: "panas" },
  { name: "Protein Structure Prediction", field: "q-bio.BM", growth: 198, papers: 4210, heat: "meningkat" },
  { name: "Quantum Error Correction", field: "quant-ph", growth: 167, papers: 2870, heat: "meningkat" },
  { name: "RLHF & Alignment", field: "cs.AI", growth: 156, papers: 3150, heat: "meningkat" },
  { name: "Multimodal Models", field: "cs.CV", growth: 143, papers: 5620, heat: "meningkat" },
  { name: "Graph Neural Networks", field: "cs.LG", growth: 121, papers: 6780, heat: "stabil" },
  { name: "Neural Architecture Search", field: "cs.NE", growth: 89, papers: 2430, heat: "stabil" },
];

const TREND_FIELDS = [
  { name: "Kecerdasan Buatan", papers: 42800, novelty: 94, color: "#3b82f6" },
  { name: "Ilmu Saraf", papers: 31200, novelty: 87, color: "#8b5cf6" },
  { name: "Biologi Komputasi", papers: 28700, novelty: 83, color: "#10b981" },
  { name: "Fisika Kuantum", papers: 19300, novelty: 79, color: "#f59e0b" },
  { name: "Ilmu Material", papers: 16800, novelty: 72, color: "#ef4444" },
  { name: "Ilmu Lingkungan", papers: 14200, novelty: 68, color: "#06b6d4" },
];

const VOLUME_DATA = [
  { year: "2018", ai: 12000, bio: 18000, physics: 14000, total: 44000 },
  { year: "2019", ai: 16500, bio: 19200, physics: 14800, total: 50500 },
  { year: "2020", ai: 22000, bio: 21000, physics: 15200, total: 58200 },
  { year: "2021", ai: 31000, bio: 24500, physics: 16000, total: 71500 },
  { year: "2022", ai: 46000, bio: 27000, physics: 16800, total: 89800 },
  { year: "2023", ai: 68000, bio: 29800, physics: 17500, total: 115300 },
  { year: "2024", ai: 98000, bio: 33000, physics: 18200, total: 149200 },
  { year: "2025", ai: 124000, bio: 36500, physics: 19000, total: 179500 },
];

export default function TrendsPage() {
  const [selectedField, setSelectedField] = useState("");
  const { data: trends, isLoading } = useGetTrendsOverview({ field: selectedField });

  const heatColor = (heat: string) => {
    if (heat === "panas") return "bg-red-50 border-red-200 text-red-700";
    if (heat === "meningkat") return "bg-orange-50 border-orange-200 text-orange-700";
    return "bg-blue-50 border-blue-200 text-blue-600";
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Tren Kebaruan Riset</h1>
          <p className="text-neutral-500">Pantau kecepatan pertumbuhan bidang riset dan topik-topik yang sedang naik daun dari ArXiv.</p>
        </div>

        {/* Field Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FIELD_PILLS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedField(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedField === f.value
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BookOpen, label: "Makalah ArXiv 2025", value: "2.4 Juta+", color: "text-blue-600" },
            { icon: TrendingUp, label: "Pertumbuhan YoY", value: "+38%", color: "text-green-600" },
            { icon: Flame, label: "Topik Panas Baru", value: "127 topik", color: "text-red-600" },
            { icon: Star, label: "Makalah Berdampak Tinggi", value: "8,340", color: "text-amber-600" },
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-2xl border border-neutral-200 bg-white">
              <stat.icon className={`w-5 h-5 mb-3 ${stat.color}`} />
              <div className="text-2xl font-bold text-neutral-900 mb-1">{stat.value}</div>
              <div className="text-xs text-neutral-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Publication Volume Chart */}
        <div className="p-6 rounded-2xl border border-neutral-200 bg-white mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Volume Publikasi per Tahun
              </h2>
              <p className="text-xs text-neutral-500 mt-1">Jumlah makalah yang diunggah ke ArXiv per bidang</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VOLUME_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="year" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", borderColor: "#e5e7eb", color: "#111", borderRadius: "12px", fontSize: 12 }}
                  formatter={(value: number) => [value.toLocaleString(), ""]}
                />
                <Area type="monotone" dataKey="ai" name="Kecerdasan Buatan" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorAi)" />
                <Area type="monotone" dataKey="bio" name="Biologi" stroke="#10b981" strokeWidth={2.5} fill="url(#colorBio)" />
                <Area type="monotone" dataKey="physics" name="Fisika" stroke="#f59e0b" strokeWidth={2} fill="none" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-blue-500 rounded inline-block" /> Kecerdasan Buatan</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-emerald-500 rounded inline-block" /> Biologi</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-amber-500 rounded inline-block" /> Fisika</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Hot Topics */}
          <div>
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" /> Topik Sedang Naik Daun
            </h3>
            <div className="space-y-2.5">
              {HOT_TOPICS.map((topic, i) => (
                <div key={i} className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-neutral-900 text-sm truncate">{topic.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${heatColor(topic.heat)}`}>
                        {topic.heat}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">{topic.field} · {topic.papers.toLocaleString()} makalah</p>
                  </div>
                  <div className="flex items-center text-green-600 bg-green-50 px-3 py-1.5 rounded-lg ml-3 flex-shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                    <span className="font-bold text-sm">+{topic.growth}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Fields Novelty Bar */}
          <div>
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" /> Skor Kebaruan per Bidang
            </h3>
            <div className="p-5 rounded-xl border border-neutral-200 bg-white mb-4">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TREND_FIELDS} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#374151", fontSize: 11 }} tickLine={false} axisLine={false} width={130} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", borderColor: "#e5e7eb", borderRadius: "8px", fontSize: 12 }}
                      formatter={(v: number) => [`${v}/100`, "Skor Kebaruan"]}
                    />
                    <Bar dataKey="novelty" radius={[0, 6, 6, 0]}>
                      {TREND_FIELDS.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-2.5">
              {TREND_FIELDS.map((field, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 bg-neutral-50 hover:bg-white hover:border-neutral-200 transition">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: field.color }} />
                    <span className="text-sm font-medium text-neutral-800">{field.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span>{field.papers.toLocaleString()} makalah</span>
                    <span className="font-semibold" style={{ color: field.color }}>{field.novelty}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API data section - when loaded */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        )}
        {trends?.risingTopics && trends.risingTopics.length > 0 && (
          <div className="p-6 rounded-2xl border border-neutral-200 bg-white">
            <h3 className="text-base font-semibold mb-4">Topik Terkini (Data Real-time)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {trends.risingTopics.slice(0, 6).map((topic, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <p className="font-medium text-sm text-neutral-800 mb-1">{topic.name}</p>
                  <p className="text-xs text-neutral-500">{topic.field} · +{topic.growth}%</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
