// graph.ts
import { Router } from "express";
import { chatCompletion } from "../lib/groq";

const router = Router();

const staticConcepts = [
  { id: "c1", name: "Deep Learning", type: "concept", paperCount: 45230, description: "Neural network architectures with multiple layers" },
  { id: "c2", name: "Transformer Architecture", type: "method", paperCount: 12450, description: "Attention-based sequence-to-sequence models" },
  { id: "c3", name: "CRISPR-Cas9", type: "method", paperCount: 8920, description: "Gene editing technology" },
  { id: "c4", name: "ImageNet", type: "dataset", paperCount: 5670, description: "Large-scale image recognition dataset" },
  { id: "c5", name: "Protein Folding", type: "concept", paperCount: 6780, description: "Structure prediction of proteins" },
  { id: "c6", name: "Reinforcement Learning", type: "method", paperCount: 9870, description: "Learning through reward-based feedback" },
  { id: "c7", name: "GraphQL", type: "method", paperCount: 1230, description: "Query language for APIs" },
  { id: "c8", name: "mRNA Vaccine", type: "concept", paperCount: 3450, description: "Messenger RNA-based immunization" },
  { id: "c9", name: "Federated Learning", type: "method", paperCount: 4560, description: "Distributed machine learning" },
  { id: "c10", name: "AlphaFold", type: "dataset", paperCount: 2340, description: "Protein structure predictions database" },
];

function assignPositions(nodes: object[]): object[] {
  const radius = 300;
  return (nodes as Array<Record<string, unknown>>).map((node, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI;
    return {
      ...node,
      x: Math.cos(angle) * radius * (0.4 + Math.random() * 0.6),
      y: Math.sin(angle) * radius * (0.4 + Math.random() * 0.6),
    };
  });
}

// Explore knowledge graph
router.post("/explore", async (req, res) => {
  const { concept, depth = 2, field } = req.body as {
    concept: string;
    depth?: number;
    field?: string;
  };

  try {
    const prompt = `Generate a knowledge graph for the research concept: "${concept}"${field ? ` in ${field}` : ""}.

Create nodes representing related concepts, methods, datasets, researchers, and institutions.
Create edges showing relationships between them.

Respond in this exact JSON format:
{
  "nodes": [
    {
      "id": "node_1",
      "label": "Concept Name",
      "type": "concept",
      "weight": 9.5,
      "description": "Brief description",
      "paperCount": 1250
    }
  ],
  "edges": [
    {
      "source": "node_1",
      "target": "node_2",
      "relationship": "enables",
      "strength": 0.85
    }
  ],
  "centralConcept": "${concept}",
  "insights": "A 2-sentence insight about how these concepts connect"
}

Generate exactly ${depth === 1 ? 8 : 14} nodes and ${depth === 1 ? 10 : 20} edges.
Node types: "concept", "method", "dataset", "researcher", "institution"
Use realistic scientific terms. Return ONLY valid JSON.`;

    const response = await chatCompletion([{ role: "user", content: prompt }], {
      temperature: 0.6,
      maxTokens: 2000,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse graph data");

    const parsed = JSON.parse(jsonMatch[0]);
    parsed.nodes = assignPositions(parsed.nodes);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Graph explore failed");
    res.status(500).json({ error: "Failed to explore knowledge graph" });
  }
});

// Search concepts
router.get("/concepts", async (req, res) => {
  const q = req.query.q as string;

  const filtered = q
    ? staticConcepts.filter(c =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.description.toLowerCase().includes(q.toLowerCase())
      )
    : staticConcepts;

  res.json(filtered);
});

// Get related concepts for a concept
router.get("/concept/:id/related", async (req, res) => {
  const { id } = req.params;

  try {
    // Resolve the raw id to its actual concept name before it hits the prompt —
    // the LLM has no idea what "c1" means, but it knows what "Deep Learning" means.
    const concept = staticConcepts.find(c => c.id === id);
    const conceptName = concept?.name ?? id;

    const prompt = `Generate a small knowledge graph showing concepts related to "${conceptName}".

Return JSON in this exact format:
{
  "nodes": [
    {"id": "n1", "label": "Main Concept", "type": "concept", "weight": 9.0, "description": "Central idea", "paperCount": 500},
    {"id": "n2", "label": "Related Method", "type": "method", "weight": 7.5, "description": "Related method", "paperCount": 300}
  ],
  "edges": [
    {"source": "n1", "target": "n2", "relationship": "uses", "strength": 0.8}
  ],
  "centralConcept": "${conceptName}",
  "insights": "These concepts connect through shared methodologies."
}

Generate 6 nodes and 8 edges. Return ONLY valid JSON.`;

    const response = await chatCompletion([{ role: "user", content: prompt }], {
      temperature: 0.5,
      maxTokens: 1500,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse");
    const parsed = JSON.parse(jsonMatch[0]);
    parsed.nodes = assignPositions(parsed.nodes);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Get related concepts failed");
    res.status(500).json({ error: "Failed to get related concepts" });
  }
});

export default router;
