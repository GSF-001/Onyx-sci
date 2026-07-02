import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import { useDiscoverGaps } from "@workspace/api-client-react";
import { Lightbulb, Target, TrendingDown, Zap, ArrowRight, BookOpen } from "lucide-react";

const FIELD_IMAGES: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1532094349884-543559ddb4e2?w=600&q=70",
  ai: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=70",
  biology: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&q=70",
  medicine: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=70",
  physics: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&q=70",
  climate: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&q=70",
  chemistry: "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=600&q=70",
  quantum: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=70",
  neuroscience: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&q=70",
};

function getFieldImage(field: string): string {
  const lower = field.toLowerCase();
  if (lower.includes("ai") || lower.includes("machine") || lower.includes("deep") || lower.includes("neural") || lower.includes("language")) return FIELD_IMAGES.ai;
  if (lower.includes("bio") || lower.includes("gene") || lower.includes("protein") || lower.includes("cell")) return FIELD_IMAGES.biology;
  if (lower.includes("medic") || lower.includes("clinic") || lower.includes("cancer") || lower.includes("health") || lower.includes("drug")) return FIELD_IMAGES.medicine;
  if (lower.includes("physic") || lower.includes("quantum") || lower.includes("photon")) return FIELD_IMAGES.physics;
  if (lower.includes("climate") || lower.includes("carbon") || lower.includes("environment")) return FIELD_IMAGES.climate;
  if (lower.includes("chem") || lower.includes("material") || lower.includes("polymer")) return FIELD_IMAGES.chemistry;
  if (lower.includes("neuro") || lower.includes("brain") || lower.includes("cognitive")) return FIELD_IMAGES.neuroscience;
  return FIELD_IMAGES.default;
}

const POPULAR_FIELDS = [
  "AI & Healthcare",
  "CRISPR Gene Therapy",
  "Quantum Computing",
  "Climate Change",
  "Cognitive Neuroscience",
  "Renewable Energy",
];

export default function GapsPage() {
  const [field, setField] = useState("");
  const gapsMutation = useDiscoverGaps();

  const handleDiscover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!field.trim()) return;
    gapsMutation.mutate({ data: { field } });
  };

  const submit = (f: string) => {
    setField(f);
    gapsMutation.mutate({ data: { field: f } });
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Gap Discovery</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
            Find Unexplored Research Opportunities
          </h1>
          <p className="text-neutral-500 text-sm leading-relaxed max-w-xl">
            Enter your research field and AI will identify high-potential gaps for further investigation.
          </p>
        </div>

        {/* Search form */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4 md:p-5 mb-6">
          <form onSubmit={handleDiscover}>
            <div className="flex gap-3 items-center">
              <div className="flex-1 flex items-center gap-3 border border-white/10 rounded-xl px-4 py-3 focus-within:border-amber-400/40 transition-colors bg-white/3">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <input
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="e.g.: Reinforcement Learning, Materials Science, Cell Biology..."
                  className="flex-1 bg-transparent text-sm outline-none text-neutral-200 placeholder:text-neutral-600"
                />
              </div>
              <button
                type="submit"
                disabled={gapsMutation.isPending || !field.trim()}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-xl disabled:opacity-40 transition-colors flex-shrink-0"
              >
                {gapsMutation.isPending ? "Analyzing..." : "Discover Gaps"}
              </button>
            </div>

            {/* Popular fields */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-neutral-600 self-center">Popular:</span>
              {POPULAR_FIELDS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => submit(f)}
                  className="text-xs px-3 py-1 border border-white/8 rounded-full text-neutral-500 hover:border-amber-400/30 hover:text-amber-400 hover:bg-amber-400/5 transition-all"
                >
                  {f}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Loading skeleton */}
        {gapsMutation.isPending && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-white/6 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 bg-white/4" />
                <div className="p-5 space-y-2">
                  <div className="h-5 bg-white/4 rounded w-3/4" />
                  <div className="h-4 bg-white/3 rounded w-full" />
                  <div className="h-4 bg-white/3 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {gapsMutation.data && !gapsMutation.isPending && (
          <div className="space-y-6">
            {/* Summary banner */}
            <div className="bg-amber-500/6 border border-amber-500/15 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="font-bold text-amber-300 mb-1">
                  Analysis: {gapsMutation.data.field}
                </div>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {gapsMutation.data.summary || "Identified several high-potential research gaps with low competition."}
                </p>
              </div>
            </div>

            {/* Gap cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {gapsMutation.data.gaps.map((gap, idx) => {
                const imgUrl = getFieldImage(gapsMutation.data!.field + " " + gap.title);
                const competitionColor =
                  gap.competitionLevel === "Low"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : gap.competitionLevel === "Medium"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20";
                const diffColor =
                  gap.difficultyLevel === "Low"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : gap.difficultyLevel === "Medium"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20";

                return (
                  <article
                    key={gap.id}
                    className="border border-white/6 rounded-2xl overflow-hidden hover:border-amber-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] transition-all group bg-white/2"
                  >
                    {/* Visual header */}
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={gap.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                        onError={(e) => { (e.target as HTMLImageElement).src = FIELD_IMAGES.default; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      <div className="absolute bottom-3 left-4 flex items-center gap-2">
                        <span className="text-xs bg-black/60 text-white px-2 py-0.5 rounded-full font-medium border border-white/10">
                          Impact: {gap.impactScore}/10
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${competitionColor}`}>
                          {gap.competitionLevel === "Low" ? "Low" : gap.competitionLevel === "Medium" ? "Medium" : "High"} Competition
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="text-2xl font-black text-white/15">#{idx + 1}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-bold text-base text-neutral-200 leading-snug group-hover:text-amber-400 transition-colors flex-1">
                          {gap.title}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${diffColor}`}>
                          {gap.difficultyLevel === "Low" ? "Easy" : gap.difficultyLevel === "Medium" ? "Medium" : "Hard"}
                        </span>
                      </div>

                      <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                        {gap.description}
                      </p>

                      {gap.opportunity && (
                        <div className="space-y-2">
                          <div className="p-3 bg-red-500/6 border border-red-500/12 rounded-xl">
                            <div className="flex items-center gap-1.5 mb-1">
                              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                              <span className="text-xs font-semibold text-red-400">Current Problem</span>
                            </div>
                            <p className="text-xs text-neutral-500 leading-relaxed">
                              This area lacks in-depth research and strong empirical evidence.
                            </p>
                          </div>
                          <div className="p-3 bg-emerald-500/6 border border-emerald-500/12 rounded-xl">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Zap className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-xs font-semibold text-emerald-400">Research Opportunity</span>
                            </div>
                            <p className="text-xs text-neutral-500 leading-relaxed">{gap.opportunity}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-3 pt-3 border-t border-white/5">
                        <button className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors">
                          <BookOpen className="w-3.5 h-3.5" />
                          Find Related Papers
                        </button>
                        <button className="ml-auto flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-300 transition-colors">
                          Explore
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!gapsMutation.data && !gapsMutation.isPending && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-amber-500/8 border border-amber-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-amber-400 opacity-60" />
            </div>
            <h3 className="font-bold text-neutral-300 mb-2">Start Exploring Research Gaps</h3>
            <p className="text-sm text-neutral-600 max-w-sm mx-auto">
              Enter your research field above, and AI will analyze the literature to find the best research opportunities.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
