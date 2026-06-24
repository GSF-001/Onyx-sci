import { Router } from "express";
import { chatCompletion } from "../lib/groq";

const router = Router();

function generateTimeseries(baseValue: number, years: number[], trend: "up" | "down" | "volatile" = "up"): Array<{ year: number; value: number; label?: string }> {
  return years.map((year, i) => {
    const multiplier = trend === "up" ? 1 + i * 0.15 : trend === "down" ? 1 - i * 0.08 : 1;
    const noise = (Math.random() - 0.5) * 0.2;
    return { year, value: Math.max(10, Math.round(baseValue * multiplier * (1 + noise))) };
  });
}

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];

// Trends overview
router.get("/overview", async (req, res) => {
  const field = req.query.field as string | undefined;

  res.json({
    risingTopics: [
      { name: "Neuro-symbolic AI", growth: 284, field: "Artificial Intelligence", paperCount: 1240, description: "Combining neural networks with symbolic reasoning" },
      { name: "Protein Language Models", growth: 231, field: "Computational Biology", paperCount: 890, description: "Large language models applied to protein sequences" },
      { name: "Quantum Machine Learning", growth: 198, field: "Quantum Computing", paperCount: 670, description: "Quantum algorithms for ML acceleration" },
      { name: "Solid-State Batteries", growth: 175, field: "Materials Science", paperCount: 1560, description: "Next-generation battery technology" },
      { name: "Multimodal Foundation Models", growth: 162, field: "Machine Learning", paperCount: 2340, description: "Models handling vision, language, and audio" },
      { name: "mRNA Therapeutics", growth: 145, field: "Biomedicine", paperCount: 1890, description: "RNA-based treatment modalities beyond vaccines" },
    ],
    emergingMethods: [
      "Diffusion Models", "State Space Models", "Mixture of Experts",
      "Retrieval-Augmented Generation", "Neural Radiance Fields", "Constitutional AI"
    ],
    trendingFields: [
      { name: "Artificial Intelligence", noveltyScore: 9.2, paperCount: 45230, growthRate: 34.5 },
      { name: "Computational Biology", noveltyScore: 8.8, paperCount: 23450, growthRate: 28.3 },
      { name: "Materials Science", noveltyScore: 8.1, paperCount: 18900, growthRate: 22.1 },
      { name: "Quantum Computing", noveltyScore: 7.9, paperCount: 9870, growthRate: 41.2 },
      { name: "Neuroscience", noveltyScore: 7.6, paperCount: 31200, growthRate: 18.9 },
    ],
    timeseriesData: [
      ...YEARS.map((year, i) => ({ year, value: 12000 + i * 2800 + Math.round(Math.random() * 500) })),
    ],
    aiInsight: field
      ? `The field of ${field} is experiencing rapid growth, with novelty scores increasing 23% year-over-year. Key breakthroughs are emerging at the intersection of machine learning and experimental methods.`
      : "Research output has increased 34% globally in the past 5 years, with AI and computational biology driving the highest novelty scores. Cross-disciplinary work is becoming the dominant source of breakthrough discoveries.",
  });
});

// Analyze trends for a specific topic
router.post("/analyze", async (req, res) => {
  const { topic, yearsBack = 5 } = req.body as { topic: string; yearsBack?: number };

  try {
    const prompt = `Analyze research trends for the topic: "${topic}".

Respond in this exact JSON format:
{
  "noveltyScore": 8.2,
  "velocityScore": 7.5,
  "insights": "2-3 sentence analysis of where this research area is headed",
  "predictedGrowth": "High growth expected in 2025-2026 driven by...",
  "keyPapers": [
    {
      "id": "p1",
      "title": "Key paper title",
      "authors": ["Author One"],
      "year": 2023,
      "abstract": "Brief abstract",
      "journal": "Nature",
      "citationCount": 234,
      "isOpenAccess": true,
      "keywords": ["keyword"],
      "noveltyScore": 8.9,
      "relevanceScore": 9.5
    }
  ]
}

noveltyScore and velocityScore are 0-10. Generate 3-5 key papers. Return ONLY valid JSON.`;

    const response = await chatCompletion([{ role: "user", content: prompt }], {
      temperature: 0.5,
      maxTokens: 2000,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse");
    const parsed = JSON.parse(jsonMatch[0]);

    const baseYear = 2024 - yearsBack;
    const years = Array.from({ length: yearsBack + 1 }, (_, i) => baseYear + i);

    res.json({
      topic,
      noveltyScore: parsed.noveltyScore,
      velocityScore: parsed.velocityScore,
      timeseriesData: generateTimeseries(500, years, "up"),
      keyPapers: (parsed.keyPapers ?? []).map((p: Record<string, unknown>) => ({ ...p, field: topic })),
      insights: parsed.insights,
      predictedGrowth: parsed.predictedGrowth,
    });
  } catch (err) {
    req.log.error({ err }, "Trend analysis failed");
    res.status(500).json({ error: "Failed to analyze trends" });
  }
});

// Get rising topics
router.get("/rising", async (_req, res) => {
  res.json([
    { name: "Neuro-symbolic AI", growth: 284, field: "Artificial Intelligence", paperCount: 1240, description: "Combining neural networks with symbolic reasoning" },
    { name: "Protein Language Models", growth: 231, field: "Computational Biology", paperCount: 890, description: "LLMs applied to protein sequences" },
    { name: "Quantum Machine Learning", growth: 198, field: "Quantum Computing", paperCount: 670, description: "Quantum algorithms for ML" },
    { name: "Solid-State Batteries", growth: 175, field: "Materials Science", paperCount: 1560, description: "Next-gen battery technology" },
    { name: "Multimodal Foundation Models", growth: 162, field: "Machine Learning", paperCount: 2340, description: "Vision, language, and audio models" },
    { name: "mRNA Therapeutics", growth: 145, field: "Biomedicine", paperCount: 1890, description: "RNA-based treatments beyond vaccines" },
    { name: "Embodied AI", growth: 138, field: "Robotics", paperCount: 890, description: "AI agents interacting with physical world" },
    { name: "Drug-Target Interaction", growth: 127, field: "Pharmacology", paperCount: 2100, description: "Computational drug binding prediction" },
  ]);
});

export default router;
