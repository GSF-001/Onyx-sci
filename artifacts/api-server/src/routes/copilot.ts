import { Router } from "express";
import { db } from "@workspace/db";
import { copilotSessionsTable, copilotMessagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { chatCompletion } from "../lib/groq";
import { generateId } from "../lib/id";

const router = Router();

// Ask copilot a research question
router.post("/ask", async (req, res) => {
  const { question, sessionId, context } = req.body as {
    question: string;
    sessionId?: string;
    context?: string;
  };

  try {
    const systemPrompt = `You are OASIS Research AI Copilot — an expert scientific research assistant with access to 100M+ academic papers. You provide accurate, well-cited answers to research questions.

When answering:
1. Give a comprehensive, scientifically accurate answer
2. Reference specific papers with [1], [2], [3] citation markers inline
3. At the end, list citations in this exact JSON format within a <citations> block
4. Suggest 3 follow-up questions

Format your response as:
ANSWER: <your detailed answer with [1][2] citation markers>

<citations>
[
  {"id": "paper_1", "title": "Paper Title", "authors": ["Author A", "Author B"], "year": 2023, "journal": "Nature", "url": "https://doi.org/xxx"},
  ...
]
</citations>

FOLLOW_UPS:
- Question 1?
- Question 2?
- Question 3?`;

    const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...(context ? [{ role: "user" as const, content: `Context: ${context}` }] : []),
      { role: "user", content: question },
    ];

    const response = await chatCompletion(messages, { temperature: 0.4, maxTokens: 2500 });

    // Parse response
    const answerMatch = response.match(/ANSWER:([\s\S]*?)(?=<citations>|FOLLOW_UPS:|$)/i);
    const citationsMatch = response.match(/<citations>([\s\S]*?)<\/citations>/i);
    const followUpsMatch = response.match(/FOLLOW_UPS:([\s\S]*?)$/i);

    let citations = [];
    if (citationsMatch) {
      try {
        citations = JSON.parse(citationsMatch[1].trim());
      } catch (_) {
        citations = [];
      }
    }

    const followUps = followUpsMatch
      ? followUpsMatch[1]
          .trim()
          .split("\n")
          .filter((l: string) => l.trim().startsWith("-"))
          .map((l: string) => l.replace(/^-\s*/, "").trim())
          .filter(Boolean)
      : [];

    const answer = answerMatch ? answerMatch[1].trim() : response;

    // Save to session if sessionId provided
    let activeSessionId = sessionId;
    if (activeSessionId) {
      const userMsgId = generateId();
      const aiMsgId = generateId();
      await db.insert(copilotMessagesTable).values([
        { id: userMsgId, sessionId: activeSessionId, role: "user", content: question, citations: [] },
        { id: aiMsgId, sessionId: activeSessionId, role: "assistant", content: answer, citations },
      ]);
      await db
        .update(copilotSessionsTable)
        .set({
          messageCount: db.$count(copilotMessagesTable, eq(copilotMessagesTable.sessionId, activeSessionId)),
          lastMessage: question.slice(0, 100),
          updatedAt: new Date(),
        })
        .where(eq(copilotSessionsTable.id, activeSessionId));
    } else {
      // Auto-create session
      activeSessionId = generateId();
      await db.insert(copilotSessionsTable).values({
        id: activeSessionId,
        title: question.slice(0, 80),
        messageCount: 2,
        lastMessage: question.slice(0, 100),
      });
      const userMsgId = generateId();
      const aiMsgId = generateId();
      await db.insert(copilotMessagesTable).values([
        { id: userMsgId, sessionId: activeSessionId, role: "user", content: question, citations: [] },
        { id: aiMsgId, sessionId: activeSessionId, role: "assistant", content: answer, citations },
      ]);
    }

    res.json({
      answer,
      citations,
      sessionId: activeSessionId,
      followUpQuestions: followUps,
      papersUsed: citations.length,
    });
  } catch (err) {
    req.log.error({ err }, "Copilot ask failed");
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

// Summarize a paper
router.post("/summarize", async (req, res) => {
  const { text, paperId, mode = "brief" } = req.body as {
    text: string;
    paperId?: string;
    mode?: string;
  };

  try {
    const modeInstructions: Record<string, string> = {
      brief: "Provide a brief 2-3 sentence summary",
      detailed: "Provide a detailed summary covering all major sections",
      technical: "Provide a technical summary focused on methods and results",
      layperson: "Explain this paper in simple terms a non-expert can understand",
    };

    const prompt = `${modeInstructions[mode] || modeInstructions.brief} of this research paper text.

Paper text: "${text.slice(0, 3000)}"

Respond in this JSON format:
{
  "summary": "Main summary paragraph",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "limitations": ["Limitation 1", "Limitation 2"],
  "futureDirections": ["Direction 1", "Direction 2"],
  "readingTime": 5
}

Return ONLY valid JSON.`;

    const response = await chatCompletion([{ role: "user", content: prompt }], { temperature: 0.3 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse summary");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    req.log.error({ err }, "Summarize failed");
    res.status(500).json({ error: "Failed to summarize paper" });
  }
});

// Get sessions
router.get("/sessions", async (_req, res) => {
  try {
    const sessions = await db
      .select()
      .from(copilotSessionsTable)
      .orderBy(copilotSessionsTable.updatedAt);
    res.json(sessions.map(s => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt?.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Get sessions failed");
    res.status(500).json({ error: "Failed to get sessions" });
  }
});

// Create session
router.post("/sessions", async (req, res) => {
  const { title } = req.body as { title: string };
  try {
    const id = generateId();
    const [session] = await db
      .insert(copilotSessionsTable)
      .values({ id, title, messageCount: 0 })
      .returning();
    res.status(201).json({ ...session, createdAt: session.createdAt.toISOString(), updatedAt: session.updatedAt?.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Create session failed");
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Get messages for a session
router.get("/sessions/:id/messages", async (req, res) => {
  try {
    const messages = await db
      .select()
      .from(copilotMessagesTable)
      .where(eq(copilotMessagesTable.sessionId, req.params.id))
      .orderBy(copilotMessagesTable.createdAt);
    res.json(messages.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      citations: (m.citations as object[]) ?? [],
    })));
  } catch (err) {
    req.log.error({ err }, "Get messages failed");
    res.status(500).json({ error: "Failed to get messages" });
  }
});

export default router;
