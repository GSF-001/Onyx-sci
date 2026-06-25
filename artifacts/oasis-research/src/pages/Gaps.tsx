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
  "Kecerdasan Buatan & Kesehatan",
  "CRISPR dan Terapi Gen",
  "Komputasi Kuantum",
  "Perubahan Iklim",
  "Ilmu Saraf Kognitif",
  "Energi Terbarukan",
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
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Penemuan Celah</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
            Temukan Peluang Riset yang Belum Dieksplorasi
          </h1>
          <p className="text-neutral-500 text-sm leading-relaxed max-w-xl">
            Masukkan bidang penelitian Anda, dan AI akan mengidentifikasi celah-celah yang berpotensi tinggi untuk diteliti lebih lanjut.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleDiscover} className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5 mb-6 shadow-sm">
          <div className="flex gap-3 items-center">
            <div className="flex-1 flex items-center gap-3 border border-neutral-200 rounded-xl px-4 py-3 focus-within:border-amber-400 transition-colors bg-neutral-50">
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <input
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="Contoh: Reinforcement Learning, Ilmu Material, Biologi Sel..."
                className="flex-1 bg-transparent text-sm outline-none text-neutral-900 placeholder:text-neutral-400"
              />
            </div>
            <button
              type="submit"
              disabled={gapsMutation.isPending || !field.trim()}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors flex-shrink-0"
            >
              {gapsMutation.isPending ? "Menganalisis..." : "Temukan Celah"}
            </button>
          </div>

          {/* Popular fields */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-neutral-400 self-center">Populer:</span>
            {POPULAR_FIELDS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => submit(f)}
                className="text-xs px-3 py-1 border border-neutral-200 rounded-full text-neutral-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
              >
                {f}
              </button>
            ))}
          </div>
        </form>

        {/* Loading skeleton */}
        {gapsMutation.isPending && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-neutral-100 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 bg-neutral-100" />
                <div className="p-5 space-y-2">
                  <div className="h-5 bg-neutral-100 rounded w-3/4" />
                  <div className="h-4 bg-neutral-100 rounded w-full" />
                  <div className="h-4 bg-neutral-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {gapsMutation.data && !gapsMutation.isPending && (
          <div className="space-y-6">
            {/* Summary banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-semibold text-amber-900 mb-1">
                  Analisis: {gapsMutation.data.field}
                </div>
                <p className="text-amber-800/80 text-sm leading-relaxed">
                  {gapsMutation.data.summary || "Teridentifikasi beberapa celah riset berpotensi tinggi dengan kompetisi rendah."}
                </p>
              </div>
            </div>

            {/* Gap cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {gapsMutation.data.gaps.map((gap, idx) => {
                const imgUrl = getFieldImage(gapsMutation.data!.field + " " + gap.title);
                const competitionColor =
                  gap.competitionLevel === "Low"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : gap.competitionLevel === "Medium"
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-red-100 text-red-700 border-red-200";
                const diffColor =
                  gap.difficultyLevel === "Low"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : gap.difficultyLevel === "Medium"
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-red-100 text-red-700 border-red-200";
                return (
                  <article
                    key={gap.id}
                    className="border border-neutral-100 rounded-2xl overflow-hidden hover:border-amber-200 hover:shadow-md transition-all group"
                  >
                    {/* Visual header */}
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={gap.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FIELD_IMAGES.default;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-4 flex items-center gap-2">
                        <span className="text-xs bg-black/50 text-white px-2 py-0.5 rounded-full font-medium border border-white/20">
                          Skor Dampak: {gap.impactScore}/10
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${competitionColor}`}>
                          Kompetisi: {gap.competitionLevel === "Low" ? "Rendah" : gap.competitionLevel === "Medium" ? "Sedang" : "Tinggi"}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="text-2xl font-black text-white/20">#{idx + 1}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-bold text-base text-neutral-900 leading-snug group-hover:text-amber-700 transition-colors flex-1">
                          {gap.title}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${diffColor}`}>
                          Kesulitan: {gap.difficultyLevel === "Low" ? "Rendah" : gap.difficultyLevel === "Medium" ? "Sedang" : "Tinggi"}
                        </span>
                      </div>

                      <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                        {gap.description}
                      </p>

                      {/* Masalah & Solusi */}
                      {gap.opportunity && (
                        <div className="space-y-2">
                          <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                            <div className="flex items-center gap-1.5 mb-1">
                              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                              <span className="text-xs font-semibold text-red-700">Masalah Saat Ini</span>
                            </div>
                            <p className="text-xs text-red-700/80 leading-relaxed">
                              Area ini masih kekurangan penelitian mendalam dan bukti empiris yang kuat.
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Zap className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-xs font-semibold text-green-700">Peluang Riset</span>
                            </div>
                            <p className="text-xs text-green-700/80 leading-relaxed">{gap.opportunity}</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex items-center gap-3 pt-3 border-t border-neutral-50">
                        <button className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors">
                          <BookOpen className="w-3.5 h-3.5" />
                          Cari Makalah Terkait
                        </button>
                        <button className="ml-auto flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
                          Jelajahi
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
            <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">Mulai Eksplorasi Celah Riset</h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto">
              Masukkan bidang penelitian di atas, dan AI akan menganalisis literatur untuk menemukan peluang riset terbaik.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
