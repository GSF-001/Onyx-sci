import React, { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowRight, FileText, Quote, BookOpen, Search, Sparkles, Network, Lightbulb, TrendingUp, Users, ExternalLink } from "lucide-react";

const SAMPLE_PAPERS = [
  { title: "AlphaFold 3: Prediksi Struktur Protein Kompleks", journal: "Nature", year: 2024, citations: 3421, openAccess: true },
  { title: "Mekanisme Transfer Energi Kuantum pada Fotosintesis", journal: "Science", year: 2024, citations: 891, openAccess: true },
  { title: "Terapi Gen CRISPR-Cas9 untuk Kanker Pankreas", journal: "Cell", year: 2023, citations: 1204, openAccess: false },
  { title: "LLM untuk Penemuan Obat Baru: Studi Sistematis", journal: "PNAS", year: 2024, citations: 567, openAccess: true },
  { title: "Komputasi Kuantum: Koreksi Error pada Skala Besar", journal: "Physical Review", year: 2024, citations: 342, openAccess: true },
  { title: "Seqüência de RNA de Célula Única em Tecidos Neurais", journal: "Nature Methods", year: 2023, citations: 2109, openAccess: false },
];

const FEATURES = [
  { icon: Search, label: "Pencarian Semantik", desc: "Temukan jutaan makalah dengan bahasa alami", color: "text-blue-400" },
  { icon: Sparkles, label: "Kopilot AI", desc: "Tanya jawab berdasarkan literatur ilmiah nyata", color: "text-purple-400" },
  { icon: Network, label: "Grafik Pengetahuan", desc: "Visualisasi hubungan antar konsep & peneliti", color: "text-green-400" },
  { icon: Lightbulb, label: "Penemuan Celah", desc: "Identifikasi area penelitian yang belum dieksplorasi", color: "text-yellow-400" },
  { icon: TrendingUp, label: "Tren Kebaruan", desc: "Lacak topik ilmiah yang sedang naik daun", color: "text-orange-400" },
  { icon: Users, label: "Kolaborasi", desc: "Terhubung dengan peneliti satu bidang", color: "text-pink-400" },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const dots: { x: number; y: number; z: number }[] = Array.from({ length: 300 }, () => ({
      x: Math.random() * W - W / 2,
      y: Math.random() * H - H / 2,
      z: Math.random() * W,
    }));

    const draw = () => {
      ctx.fillStyle = "rgba(4,4,10,0.85)";
      ctx.fillRect(0, 0, W, H);
      for (const d of dots) {
        d.z -= 0.5;
        if (d.z <= 0) { d.x = Math.random() * W - W / 2; d.y = Math.random() * H - H / 2; d.z = W; }
        const x = W / 2 + (d.x / d.z) * W;
        const y = H / 2 + (d.y / d.z) * H;
        const s = Math.max(0.2, (1 - d.z / W) * 2.2);
        const a = 0.3 + (1 - d.z / W) * 0.7;
        ctx.fillStyle = `rgba(180,200,255,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(animId); };
  }, []);

  return (
    <div className="min-h-screen bg-[#04040a] text-white font-sans overflow-x-hidden relative">
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#04040a]/30 to-[#04040a]/80 z-0 pointer-events-none" />

      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img src="/oasis-logo.png" alt="OASIS" className="w-9 h-9 object-contain invert" />
          <div className="leading-none">
            <div className="font-black text-sm tracking-[0.1em] text-white">OASIS</div>
            <div className="font-medium text-[9px] tracking-[0.16em] text-neutral-400 -mt-0.5">Research</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/sign-in")}
            className="text-sm text-neutral-400 hover:text-white transition-colors px-4 py-2"
          >
            Masuk
          </button>
          <button
            onClick={() => setLocation("/sign-up")}
            className="text-sm bg-white text-black font-semibold px-5 py-2 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            Mulai Gratis
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-neutral-400 font-medium tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Platform Intelijen Riset Berbasis AI
          </span>
        </div>

        <h1 className="text-center text-[clamp(2.2rem,7vw,5rem)] font-serif font-semibold leading-[1.08] mb-5 max-w-4xl mx-auto">
          Jelajahi Apa yang<br />
          Sedang Diteliti Dunia
          <br />
          <span className="text-neutral-500 italic">Saat Ini.</span>
        </h1>

        <p className="text-center text-neutral-400 text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Akses 280 juta+ makalah ilmiah, temukan celah penelitian,
          dan analisis tren sains dengan bantuan kecerdasan buatan.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <button
            onClick={() => setLocation("/sign-up")}
            className="flex items-center gap-2 bg-white text-black font-semibold px-8 py-4 rounded-2xl hover:bg-neutral-100 transition-colors text-sm shadow-lg"
          >
            <img src="/oasis-logo.png" alt="" className="w-5 h-5 object-contain" />
            Mulai Riset Sekarang
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLocation("/sign-in")}
            className="flex items-center gap-2 bg-white/5 border border-white/15 text-white font-medium px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors text-sm"
          >
            Sudah punya akun? Masuk
          </button>
        </div>

        {/* Floating paper cards */}
        <div className="relative mb-20">
          <div className="text-xs text-neutral-600 uppercase tracking-widest text-center mb-5 font-medium">
            Makalah Terbaru dari 280M+ Sumber
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
            {SAMPLE_PAPERS.map((p, i) => (
              <div
                key={i}
                className="bg-white/4 backdrop-blur border border-white/8 rounded-2xl p-4 hover:bg-white/7 hover:border-white/15 transition-all group cursor-default"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-200 leading-snug mb-1.5 line-clamp-2">
                      {p.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                      <span className="italic">{p.journal}</span>
                      <span>·</span>
                      <span>{p.year}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Quote className="w-2.5 h-2.5" />{p.citations.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {p.openAccess && (
                    <span className="text-[10px] px-2 py-0.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-full font-medium">
                      Akses Terbuka
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features grid */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-center text-xl md:text-2xl font-semibold mb-2">Satu Platform, Semua yang Anda Butuhkan</h2>
          <p className="text-center text-neutral-500 text-sm mb-8">Dari pencarian hingga kolaborasi — semua didukung AI</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="bg-white/3 border border-white/8 rounded-2xl p-5 hover:bg-white/6 transition-all">
                  <Icon className={`w-6 h-6 mb-3 ${f.color}`} />
                  <div className="font-semibold text-sm text-white mb-1">{f.label}</div>
                  <div className="text-xs text-neutral-500 leading-relaxed">{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-2xl mx-auto mb-20">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { val: "280M+", label: "Makalah Ilmiah" },
              { val: "100+", label: "Bidang Ilmu" },
              { val: "AI", label: "Powered Penuh" },
            ].map((s) => (
              <div key={s.label} className="bg-white/3 border border-white/8 rounded-2xl py-6">
                <div className="text-2xl font-black text-white mb-1">{s.val}</div>
                <div className="text-xs text-neutral-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center pb-12">
          <div className="inline-block bg-white/3 border border-white/10 rounded-3xl px-10 py-10">
            <h2 className="text-xl md:text-2xl font-semibold mb-2">Siap Memulai Riset Anda?</h2>
            <p className="text-neutral-400 text-sm mb-6">Gratis selamanya. Tidak perlu kartu kredit.</p>
            <button
              onClick={() => setLocation("/sign-up")}
              className="flex items-center gap-2 bg-white text-black font-semibold px-8 py-3.5 rounded-2xl hover:bg-neutral-100 transition-colors text-sm mx-auto"
            >
              Daftar dengan Google
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-neutral-700 text-xs mt-8">© 2025 OASIS Research · oasisresearch.ai</p>
        </div>
      </main>
    </div>
  );
}
